import pika
from src.core.settings import settings
from src.models.email_sending import RabbitMQEmailMessage


class RabbitMQService:
    def __init__(self):
        self._connection = None
        self._channel = None

    def _connect(self):
        """Establish connection to RabbitMQ."""
        if self._connection is None or self._connection.is_closed:
            self._connection = pika.BlockingConnection(settings.RABBITMQ_CONNECTION_PARAMS)
        if self._channel is None or self._channel.is_closed:
            self._channel = self._connection.channel()
            self._channel.queue_declare(queue=settings.RABBITMQ_QUEUE, durable=True)
        return self._channel

    def send_email(self, email: RabbitMQEmailMessage):
        """Send email message to RabbitMQ with automatic reconnection."""
        try:
            channel = self._connect()
            channel.basic_publish(
                exchange='',
                routing_key=settings.RABBITMQ_QUEUE,
                body=email.model_dump_json()
            )
        except (pika.exceptions.AMQPConnectionError, pika.exceptions.StreamLostError) as e:
            # Connection lost, try to reconnect once
            self._connection = None
            self._channel = None
            channel = self._connect()
            channel.basic_publish(
                exchange='',
                routing_key=settings.RABBITMQ_QUEUE,
                body=email.model_dump_json()
            )