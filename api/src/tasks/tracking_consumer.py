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

_RETRY_DELAY = 5
_INACTIVITY_TIMEOUT = 1.0
_PREFETCH_COUNT = 10


class TrackingConsumer:
    """Background RabbitMQ consumer for tracking events."""

    def __init__(self):
        self._service = TrackingService()
        self._stop_event = threading.Event()
        self._thread: threading.Thread | None = None

    def _process(self, channel, method, properties, body) -> None:
        try:
            data = json.loads(body)
            action = data.get("action")
            tracking_id = data.get("tracking_id")

            if action and tracking_id:
                with Session(engine) as session:
                    if action == "sent":
                        self._service.record_sent(tracking_id, session)
                    elif action == "failed":
                        self._service.record_failed(
                            tracking_id, data.get("error", "unknown_error"), session
                        )
        except Exception as e:
            logger.error(f"Failed to process tracking message: {e}")
        finally:
            try:
                channel.basic_ack(method.delivery_tag)
            except Exception as e:
                logger.error(f"Failed to ack message: {e}")

    def _connect(self) -> tuple[pika.BlockingConnection, pika.adapters.blocking_connection.BlockingChannel]:
        connection = pika.BlockingConnection(settings.RABBITMQ_CONNECTION_PARAMS)
        channel = connection.channel()
        channel.queue_declare(queue=settings.RABBITMQ_TRACKING_QUEUE, durable=True)
        channel.basic_qos(prefetch_count=_PREFETCH_COUNT)
        return connection, channel

    def _run(self) -> None:
        while not self._stop_event.is_set():
            connection = None
            try:
                logger.info(f"Connecting to RabbitMQ at {settings.RABBITMQ_HOST}...")
                connection, channel = self._connect()
                for method, properties, body in channel.consume(
                    settings.RABBITMQ_TRACKING_QUEUE,
                    inactivity_timeout=_INACTIVITY_TIMEOUT,
                ):
                    if self._stop_event.is_set():
                        break
                    if method is not None:
                        self._process(channel, method, properties, body)
            except Exception as e:
                if not self._stop_event.is_set():
                    logger.error(f"RabbitMQ connection error: {e}. Retrying in {_RETRY_DELAY}s...")
                    time.sleep(_RETRY_DELAY)
            finally:
                if connection and connection.is_open:
                    connection.close()

    def start(self) -> None:
        if self._thread and self._thread.is_alive():
            logger.warning("Tracking consumer already running")
            return
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._run, daemon=True, name="TrackingConsumer")
        self._thread.start()
        logger.info("Tracking consumer started")

    def stop(self) -> None:
        self._stop_event.set()
        if self._thread:
            self._thread.join(timeout=2.0)
            self._thread = None
        logger.info("Tracking consumer stopped")


_consumer = TrackingConsumer()


def start_tracking_consumer() -> None:
    _consumer.start()


def shutdown_tracking_consumer() -> None:
    _consumer.stop()
