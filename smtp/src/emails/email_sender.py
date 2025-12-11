import smtplib
import requests
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from src.models import EmailMessage, SMTPConfig
from src.emails.template_renderer import TemplateRenderer

class EmailSender:
    """Handles email sending via SMTP."""

    def __init__(self, template_renderer: TemplateRenderer):
        self.template_renderer = template_renderer


    def _create_message(
        self,
        sender: str,
        receiver: str,
        subject: str,
        html_content: str
    ) -> MIMEMultipart:
        """Create a MIME multipart email message."""
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = sender
        msg["To"] = receiver
        msg.attach(MIMEText(html_content, "html"))
        return msg


    def _send_via_smtp(
        self,
        smtp_config: SMTPConfig,
        sender: str,
        receiver: str,
        message: MIMEMultipart
    ) -> None:
        """Connect to SMTP server and send the message."""
        print(f"Connecting to {smtp_config.host}:{smtp_config.port}...")
        
        with smtplib.SMTP(smtp_config.host, smtp_config.port) as server:
            server.starttls()
            if smtp_config.user and smtp_config.password:
                server.login(smtp_config.user, smtp_config.password)
            server.sendmail(sender, receiver, message.as_string())
        
        print(f"Email sent successfully to {receiver}")


    def send(self, email_message: EmailMessage) -> None:
        """Process and send an email from an EmailMessage payload."""
        # Load and render template
        template_content = self.template_renderer.load_template(
            email_message.template_path
        ) # Change to get the template from the api
        
        # Build arguments with tracking variables
        arguments = email_message.arguments.copy()
        tracking_id = email_message.tracking_id
        
        # Add tracking pixel for ${{pixel}} - points to track/open endpoint
        arguments["pixel"] = (
            f'<img src="api/track/open?si={tracking_id}" '
            f'width="1" height="1" alt="" style="display:none;border:0;" />'
        )
        
        # Add redirect link for ${{redirect}} - points to track/click endpoint
        arguments["redirect"] = f"api/track/click?si={tracking_id}"
        
        html_content = self.template_renderer.render(template_content, arguments)
        
        # Create and send message
        message = self._create_message(
            sender=email_message.sender_email,
            receiver=email_message.receiver_email,
            subject=email_message.subject,
            html_content=html_content
        )
        
        self._send_via_smtp(
            smtp_config=email_message.smtp_config,
            sender=email_message.sender_email,
            receiver=email_message.receiver_email,
            message=message
        )

        # Notify tracking endpoint that email was sent
        if tracking_id:
            try:
                requests.post(f"api/track/sent/{tracking_id}") #TODO change this url
            except requests.RequestException as e:
                print(f"Failed to notify tracking endpoint: {e}")

        
