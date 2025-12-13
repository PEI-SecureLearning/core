import pika
from src.core.settings import settings
from src.models.email_sending import RabbitMQEmailMessage

class RabbitMQService:
    def __init__(self):
        self.connection = pika.BlockingConnection(settings.RABBITMQ_CONNECTION_PARAMS)
        self.channel = self.connection.channel()
        self.channel.queue_declare(queue=settings.RABBITMQ_QUEUE, durable=True)

    def send_email(self, email: RabbitMQEmailMessage):
        self.channel.basic_publish(exchange='', routing_key=settings.RABBITMQ_QUEUE, body=email.model_dump_json())
