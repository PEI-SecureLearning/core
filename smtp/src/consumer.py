import json
import time
import pika
from pydantic import ValidationError

from .core.config import RabbitMQConfig, RateLimiterConfig
from .models import EmailMessage
from .emails.email_sender import EmailSender
from .rate_limiter import RateLimiter


class RabbitMQConsumer:
    """RabbitMQ consumer that processes email messages with rate limiting."""

    def __init__(
        self,
        rabbitmq_config: RabbitMQConfig,
        rate_limiter: RateLimiter,
        email_sender: EmailSender,
    ):
        self.rabbitmq_config = rabbitmq_config
        self.rate_limiter = rate_limiter
        self.email_sender = email_sender
        self._connection: pika.BlockingConnection | None = None
        self._channel: pika.adapters.blocking_connection.BlockingChannel | None = None

    def _connect(self) -> None:
        """Establish connection to RabbitMQ."""
        print(f"Connecting to RabbitMQ at {self.rabbitmq_config.RABBITMQ_HOST}...")
        self._connection = pika.BlockingConnection(self.rabbitmq_config.connection_parameters)
        self._channel = self._connection.channel()
        self._channel.queue_declare(queue=self.rabbitmq_config.RABBITMQ_QUEUE, durable=True)
        self._channel.basic_qos(prefetch_count=1)

    def _handle_message(
        self,
        ch: pika.adapters.blocking_connection.BlockingChannel,
        method: pika.spec.Basic.Deliver,
        properties: pika.spec.BasicProperties,
        body: bytes
    ) -> None:
        """Process a single message from the queue with rate limiting."""
        print(f"Received message: {body.decode()}")
        
        try:
            # Wait for rate limit slot before processing
            self.rate_limiter.acquire()
            
            data = json.loads(body)
            email_message = EmailMessage(**data)
            self.email_sender.send(email_message)
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
        print(f"Rate limit: {self.rate_limiter.max_requests} emails per {self.rate_limiter.time_window}s")
        
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
