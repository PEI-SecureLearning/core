import json
import logging
import threading
import time
import pika

from sqlmodel import Session
from src.core.db import engine
from src.core.settings import settings
from src.services.tracking import TrackingService

logger = logging.getLogger(__name__)

_consumer_thread: threading.Thread | None = None
_stop_event = threading.Event()

def process_tracking_message(channel, method, properties, body):
    """Callback process for a single tracking message."""
    try:
        data = json.loads(body)
        if data.get("action") == "sent" and "tracking_id" in data:
            tracking_id = data["tracking_id"]
            
            # Process in DB
            with Session(engine) as session:
                service = TrackingService()
                service.record_sent(tracking_id, session)
                
        channel.basic_ack(method.delivery_tag)
    except Exception as e:
        logger.error(f"Error processing tracking message: {e}")
        # Acknowledge to drop bad messages to prevent queue blocking
        try:
            channel.basic_ack(method.delivery_tag)
        except Exception as ack_err:
            logger.error(f"Failed to ack message after error: {ack_err}")


def _tracking_consumer_worker():
    """Worker function that continuously consumes tracking messages."""
    
    while not _stop_event.is_set():
        try:
            logger.info(f"Connecting to RabbitMQ tracking queue at {settings.RABBITMQ_HOST}...")
            connection = pika.BlockingConnection(settings.RABBITMQ_CONNECTION_PARAMS)
            channel = connection.channel()
            channel.queue_declare(queue=settings.RABBITMQ_TRACKING_QUEUE, durable=True)
            
            # Don't consume too many unacked messages at once
            channel.basic_qos(prefetch_count=10)
            
            for method, properties, body in channel.consume(settings.RABBITMQ_TRACKING_QUEUE, inactivity_timeout=1.0):
                if _stop_event.is_set():
                    break
                
                if method is None:
                    # Timeout reached
                    continue
                    
                process_tracking_message(channel, method, properties, body)
                    
            if connection.is_open:
                connection.close()

        except Exception as e:
            if not _stop_event.is_set():
                logger.error(f"RabbitMQ consumer connection error: {e}. Retrying in 5 seconds...")
                time.sleep(5)


def start_tracking_consumer() -> None:
    """Start the background tracking consumer thread."""
    global _consumer_thread
    
    if _consumer_thread is not None and _consumer_thread.is_alive():
        logger.warning("Tracking consumer is already running")
        return
        
    _stop_event.clear()
    _consumer_thread = threading.Thread(target=_tracking_consumer_worker, daemon=True, name="TrackingConsumer")
    _consumer_thread.start()
    logger.info("Started background RabbitMQ tracking consumer")


def shutdown_tracking_consumer() -> None:
    """Signal the background tracking consumer to stop."""
    global _consumer_thread
    
    if _consumer_thread is not None:
        _stop_event.set()
        # We don't strictly need to join if it's daemon, but it's cleaner
        _consumer_thread.join(timeout=2.0)
        _consumer_thread = None
        logger.info("Tracking consumer shutdown complete")
