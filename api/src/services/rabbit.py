import pika

class RabbitMQService:

    def __init__(self):
        self.connection = pika.BlockingConnection(pika.ConnectionParameters('localhost')) # TODO change based in config
        self.channel = self.connection.channel()
        self.channel.queue_declare(queue='email_queue')

    def send_payload(self, payload):
        self.channel.basic_publish(exchange='', routing_key='email_queue', body=payload) # TODO change based in config