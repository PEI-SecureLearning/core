import json
import smtplib
import socket
import time
import pika
from pydantic import ValidationError

from .core.config import RabbitMQConfig
from .models import EmailMessage, TrackingEvent
from .emails.email_sender import EmailSender

_SMTP_ERROR_CAUSES: list[tuple[type, str]] = [
    (smtplib.SMTPAuthenticationError, "auth_error"),
    (smtplib.SMTPConnectError, "network_error"),
    (smtplib.SMTPServerDisconnected, "network_error"),
    (ConnectionRefusedError, "network_error"),
    (TimeoutError, "network_error"),
    (socket.gaierror, "network_error"),
    (socket.timeout, "network_error"),
    (OSError, "network_error"),
]


def _classify_smtp_error(e: Exception) -> str:
    for exc_type, cause in _SMTP_ERROR_CAUSES:
        if isinstance(e, exc_type):
            return cause
    return "unknown_error"


class RabbitMQConsumer:
    """RabbitMQ consumer that processes email messages."""

    def __init__(
        self,
        rabbitmq_config: RabbitMQConfig,
        email_sender: EmailSender,
    ):
        self.rabbitmq_config = rabbitmq_config
        self.email_sender = email_sender
        self._connection: pika.BlockingConnection | None = None
        self._channel: pika.adapters.blocking_connection.BlockingChannel | None = None

    def _connect(self) -> None:
        """Establish connection to RabbitMQ."""
        print(f"Connecting to RabbitMQ at {self.rabbitmq_config.RABBITMQ_HOST}...")
        self._connection = pika.BlockingConnection(self.rabbitmq_config.connection_parameters)
        self._channel = self._connection.channel()
        self._channel.queue_declare(queue=self.rabbitmq_config.RABBITMQ_QUEUE, durable=True)
        self._channel.queue_declare(queue=self.rabbitmq_config.RABBITMQ_TRACKING_QUEUE, durable=True)
        self._channel.basic_qos(prefetch_count=1)

    def _handle_message(
        self,
        ch: pika.adapters.blocking_connection.BlockingChannel,
        method: pika.spec.Basic.Deliver,
        properties: pika.spec.BasicProperties,
        body: bytes
    ) -> None:
        """Process a single message from the queue."""

        email_message: EmailMessage | None = None
        try:
            data = json.loads(body)
            email_message = EmailMessage(**data)

            try:
                self.email_sender.send(email_message)
                event = TrackingEvent(action="sent", tracking_id=email_message.tracking_id)
                tracking_msg = event.model_dump_json()
            except Exception as send_err:
                cause = _classify_smtp_error(send_err)
                print(f"Error sending email (tracking_id={email_message.tracking_id}): {send_err} [{cause}]")
                event = TrackingEvent(
                    action="failed",
                    tracking_id=email_message.tracking_id,
                    error=cause,
                )
                tracking_msg = event.model_dump_json(exclude_none=True)

            if self._channel and self._channel.is_open:
                self._channel.basic_publish(
                    exchange="",
                    routing_key=self.rabbitmq_config.RABBITMQ_TRACKING_QUEUE,
                    body=tracking_msg
                )

        except json.JSONDecodeError:
            print("Error: Failed to decode JSON body")
        except ValidationError as e:
            print(f"Error: Invalid message format - {e}")
        except FileNotFoundError as e:
            print(f"Error: {e}")
        except Exception as e:
            print(f"Error processing message: {e}")
        finally:
            ch.basic_ack(delivery_tag=method.delivery_tag)

    def start(self) -> None:
        """Start consuming messages from the queue."""
        while True:
            try:
                self._connect()
                
                if self._channel is None:
                    raise RuntimeError("Channel not initialized")
                
                self._channel.basic_consume(
                    queue=self.rabbitmq_config.RABBITMQ_QUEUE,
                    on_message_callback=self._handle_message
                )
                
                print("Waiting for messages. To exit press CTRL+C")
                self._channel.start_consuming()

            except pika.exceptions.AMQPConnectionError:
                print("Connection failed, retrying in 5 seconds...")
                time.sleep(5)
            except KeyboardInterrupt:
                print("Exiting...")
                if self._connection and self._connection.is_open:
                    self._connection.close()
                break
            except Exception as e:
                print(f"Unexpected error: {e}")
                time.sleep(5)
