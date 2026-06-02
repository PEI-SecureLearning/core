import os
import csv
import json
import requests
from dotenv import load_dotenv

load_dotenv("deployment/.env")

KEYCLOAK_HOST = os.getenv("KEYCLOAK_HOST", "localhost")
API_HOST = os.getenv("API_HOST", "localhost")
POSTGRES_SERVER_HOST = os.getenv("POSTGRES_SERVER", "localhost")
RABBITMQ_SERVER_HOST = os.getenv("RABBITMQ_HOST", "localhost")

KEYCLOAK_URL = os.getenv("KEYCLOAK_URL", f"http://{KEYCLOAK_HOST}:8080")
API_URL = os.getenv("API_URL", f"http://{API_HOST}:8000")

def get_keycloak_token(username, password, realm="master", client_id="admin-cli", client_secret=None):
    url = f"{KEYCLOAK_URL}/realms/{realm}/protocol/openid-connect/token"
    payload = {
        "grant_type": "password",
        "client_id": client_id,
        "username": username,
        "password": password
    }
    if client_secret:
        payload["client_secret"] = client_secret
    response = requests.post(url, data=payload)
    if response.status_code != 200:
        print(f"Failed to get token for {username}: {response.text}")
    response.raise_for_status()
    return response.json()["access_token"]

def get_client_credentials_token(client_id, client_secret, realm="master"):
    url = f"{KEYCLOAK_URL}/realms/{realm}/protocol/openid-connect/token"
    payload = {
        "grant_type": "client_credentials",
        "client_id": client_id,
        "client_secret": client_secret
    }
    response = requests.post(url, data=payload)
    if response.status_code != 200:
        print(f"Failed to get client credentials token for {client_id}: {response.text}")
    response.raise_for_status()
    return response.json()["access_token"]

def insert_fake_campaigns(groups_map, sending_profile_ids):
    print("Directly inserting fake campaigns to DB using SQLModel...")
    
    # 1. Set environment variables required by pydantic Settings before importing
    os.environ["POSTGRES_SERVER"] = POSTGRES_SERVER_HOST
    os.environ["POSTGRES_PORT"] = os.getenv("POSTGRES_PORT", "5432")
    os.environ["POSTGRES_USER"] = os.getenv("POSTGRES_USER", "myuser")
    os.environ["POSTGRES_PASSWORD"] = os.getenv("POSTGRES_PASSWORD", "mypassword")
    os.environ["POSTGRES_DB"] = os.getenv("POSTGRES_DB", "mydatabase")
    
    os.environ["RABBITMQ_HOST"] = RABBITMQ_SERVER_HOST
    os.environ["RABBITMQ_USER"] = os.getenv("RABBITMQ_API_USER", "api_publisher")
    os.environ["RABBITMQ_PASS"] = os.getenv("RABBITMQ_API_PASS", "api_publisher_pass")
    os.environ["RABBITMQ_QUEUE"] = os.getenv("RABBITMQ_QUEUE", "email_queue")

    import sys
    sys.path.append(os.path.join(os.path.dirname(__file__), "api"))
    
    try:
        from sqlmodel import Session, select
        from src.core.db import engine
        from src.models import Campaign, EmailSending, User, UserGroup, SendingProfile
        from src.models.campaign.table import CampaignStatus
        from src.models.email_sending.table import EmailSendingStatus
        from datetime import datetime, timedelta

        with Session(engine) as session:
            # Check if the fake campaigns already exist to avoid duplicate inserts
            existing_campaigns = session.exec(select(Campaign).where(Campaign.realm_name == "ua")).all()
            if existing_campaigns:
                print("Fake campaigns already exist in DB.")
                return

            # Fetch users in database (these are the users we just imported)
            users = session.exec(select(User)).all()
            if not users:
                print("No users found in database to link to fake campaigns.")
                return

            # 1. Create Campaign 1: Completed Phishing Campaign (Historical Data)
            campaign1 = Campaign(
                name="Q1 Security Awareness Phishing",
                description="Completed awareness test for Q1.",
                begin_date=datetime.now() - timedelta(days=60),
                end_date=datetime.now() - timedelta(days=50),
                sending_interval_seconds=60,
                status=CampaignStatus.COMPLETED,
                total_recipients=len(users),
                total_sent=len(users),
                total_opened=int(len(users) * 0.7),
                total_clicked=int(len(users) * 0.4),
                total_phished=int(len(users) * 0.3),
                realm_name="ua",
                created_at=datetime.now() - timedelta(days=60),
                updated_at=datetime.now() - timedelta(days=50)
            )
            session.add(campaign1)
            session.flush() # populated campaign1.id

            # 2. Create Campaign 2: Running Phishing Campaign (Active Data)
            campaign2 = Campaign(
                name="Q2 Executive Spear Phishing",
                description="Active simulation testing for executives and managers.",
                begin_date=datetime.now() - timedelta(days=5),
                end_date=datetime.now() + timedelta(days=25),
                sending_interval_seconds=60,
                status=CampaignStatus.RUNNING,
                total_recipients=len(users),
                total_sent=int(len(users) * 0.5),
                total_opened=int(len(users) * 0.3),
                total_clicked=int(len(users) * 0.1),
                total_phished=int(len(users) * 0.1),
                realm_name="ua",
                created_at=datetime.now() - timedelta(days=5),
                updated_at=datetime.now() - timedelta(days=5)
            )
            session.add(campaign2)
            session.flush()

            # Link campaigns to groups
            db_groups = session.exec(select(UserGroup).where(UserGroup.keycloak_id.in_(list(groups_map.values())))).all()
            campaign1.user_groups = db_groups
            campaign2.user_groups = db_groups

            # Link campaigns to sending profiles
            db_profiles = session.exec(select(SendingProfile).where(SendingProfile.id.in_(sending_profile_ids))).all()
            campaign1.sending_profiles = db_profiles
            campaign2.sending_profiles = db_profiles

            # 3. Create simulated EmailSending tracking entries for campaign1
            interaction_map = {
                "ixsb": EmailSendingStatus.PHISHED,
                "alice.williams": EmailSendingStatus.PHISHED,
                "bob.miller": EmailSendingStatus.CLICKED,
                "carol.jones": EmailSendingStatus.OPENED,
                "david.smith": EmailSendingStatus.SENT
            }

            for user in users:
                username = user.email.split("@")[0]
                if username in interaction_map:
                    status = interaction_map[username]
                    
                    sent_at = campaign1.begin_date + timedelta(hours=2)
                    opened_at = sent_at + timedelta(minutes=10) if status in [EmailSendingStatus.OPENED, EmailSendingStatus.CLICKED, EmailSendingStatus.PHISHED] else None
                    clicked_at = opened_at + timedelta(minutes=5) if status in [EmailSendingStatus.CLICKED, EmailSendingStatus.PHISHED] else None
                    phished_at = clicked_at + timedelta(minutes=2) if status == EmailSendingStatus.PHISHED else None

                    emailsending = EmailSending(
                        user_id=user.keycloak_id,
                        scheduled_date=campaign1.begin_date,
                        status=status,
                        email_to=user.email,
                        sent_at=sent_at,
                        opened_at=opened_at,
                        clicked_at=clicked_at,
                        phished_at=phished_at,
                        campaign_id=campaign1.id
                    )
                    session.add(emailsending)

            session.commit()
            print("Successfully injected simulated campaigns and granular tracking stats!")
    except Exception as e:
        print(f"Error executing direct DB query for fake campaigns: {e}")

def main():
    print("1. Getting admin token via client credentials...")
    client_secret = os.getenv("CLIENT_SECRET", "your_very_secure_key_here")
    admin_token = get_client_credentials_token("SecureLearning-admin", client_secret, realm="master")


    print("2. Creating organization 'ua'...")
    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    realm_payload = {
        "name": "ua",
        "domain": "ua.pt",
        "adminEmail": "admin@ua.pt",
        "features": {
            "lms": True,
            "phishing": True
        }
    }
    r = requests.post(f"{API_URL}/api/realms", json=realm_payload, headers=headers_admin)
    if r.status_code == 201:
        print("Organization 'ua' created successfully.")
    elif r.status_code == 409:
        print("Organization 'ua' already exists.")
    else:
        print(f"Failed to create realm: {r.status_code} {r.text}")
        r.raise_for_status()

    print("3. Getting content_manager token...")
    content_token = get_keycloak_token("content_manager", "admin", realm="platform", client_id="react-admin")
    headers_content = {"Authorization": f"Bearer {content_token}"}

    print("4. Creating modules, courses, and templates...")
    
    # Define our rich library of learning modules with interactive sections and questions
    modules_definition = [
        {
            "title": "Introduction to Cybersecurity",
            "category": "Security",
            "description": "Learn the core concepts of information security and the common threat landscapes.",
            "estimated_time": "15 mins",
            "difficulty": "Easy",
            "sections": [
                {
                    "id": "sec_intro_1",
                    "title": "Understanding Information Security",
                    "order": 1,
                    "collapsed": False,
                    "require_correct_answers": True,
                    "is_optional": False,
                    "min_time_spent": 10,
                    "blocks": [
                        {
                            "id": "block_intro_text",
                            "kind": "text",
                            "order": 1,
                            "content": "Cybersecurity is the practice of protecting systems, networks, and programs from digital attacks. These cyberattacks are usually aimed at accessing, changing, or destroying sensitive information; extorting money from users; or interrupting normal business processes."
                        },
                        {
                            "id": "block_intro_q1",
                            "kind": "question",
                            "order": 2,
                            "question": {
                                "id": "q_intro_mc",
                                "type": "multiple_choice",
                                "text": "What is the primary goal of most cyberattacks?",
                                "choices": [
                                    {"id": "choice_a", "text": "To access, change, or destroy sensitive information.", "is_correct": True},
                                    {"id": "choice_b", "text": "To upgrade system hardware.", "is_correct": False},
                                    {"id": "choice_c", "text": "To clean desk spaces.", "is_correct": False}
                                ]
                            }
                        },
                        {
                            "id": "block_intro_q2",
                            "kind": "question",
                            "order": 3,
                            "question": {
                                "id": "q_intro_sa",
                                "type": "short_answer",
                                "text": "What does MFA stand for in the context of user authentication?",
                                "choices": [],
                                "answer": "Multi-Factor Authentication"
                            }
                        }
                    ]
                }
            ]
        },
        {
            "title": "Social Engineering and Phishing",
            "category": "Security",
            "description": "How to recognize manipulation tactics, email phishing, and spear-phishing attempts.",
            "estimated_time": "20 mins",
            "difficulty": "Easy",
            "sections": [
                {
                    "id": "sec_phish_1",
                    "title": "Phishing Techniques and Defense",
                    "order": 1,
                    "collapsed": False,
                    "require_correct_answers": True,
                    "is_optional": False,
                    "min_time_spent": 10,
                    "blocks": [
                        {
                            "id": "block_phish_text",
                            "kind": "text",
                            "order": 1,
                            "content": "Phishing is a cybercrime where targets are contacted by email, telephone or text message by someone posing as a legitimate institution to lure individuals into providing sensitive data."
                        },
                        {
                            "id": "block_phish_q1",
                            "kind": "question",
                            "order": 2,
                            "question": {
                                "id": "q_phish_tf",
                                "type": "true_false",
                                "text": "Spear phishing is a highly personalized phishing attempt targeted at a specific individual.",
                                "choices": [
                                    {"id": "choice_t", "text": "True", "is_correct": True},
                                    {"id": "choice_f", "text": "False", "is_correct": False}
                                ]
                            }
                        },
                        {
                            "id": "block_phish_q2",
                            "kind": "question",
                            "order": 3,
                            "question": {
                                "id": "q_phish_sa",
                                "type": "short_answer",
                                "text": "What term describes a targeted phishing attack explicitly aiming at C-level executives?",
                                "choices": [],
                                "answer": "Whaling"
                            }
                        }
                    ]
                }
            ]
        },
        {
            "title": "Password Security & Multi-Factor Authentication",
            "category": "Security",
            "description": "Best practices for password creation, password managers, and configuring secure MFA.",
            "estimated_time": "15 mins",
            "difficulty": "Easy",
            "sections": [
                {
                    "id": "sec_pass_1",
                    "title": "Strong Passwords & MFA",
                    "order": 1,
                    "collapsed": False,
                    "require_correct_answers": True,
                    "is_optional": False,
                    "min_time_spent": 10,
                    "blocks": [
                        {
                            "id": "block_pass_text",
                            "kind": "text",
                            "order": 1,
                            "content": "A strong password is a first line of defense. However, modern security requires Multi-Factor Authentication (MFA) to provide an extra layer of protection even if credentials are stolen."
                        },
                        {
                            "id": "block_pass_q1",
                            "kind": "question",
                            "order": 2,
                            "question": {
                                "id": "q_pass_mc",
                                "type": "multiple_choice",
                                "text": "Which of the following is considered a best practice for password management?",
                                "choices": [
                                    {"id": "choice_pass_a", "text": "Reusing the same password across multiple corporate sites.", "is_correct": False},
                                    {"id": "choice_pass_b", "text": "Using a dedicated password manager to generate unique, strong passwords.", "is_correct": True},
                                    {"id": "choice_pass_c", "text": "Writing passwords down on a sticky note under the keyboard.", "is_correct": False}
                                ]
                            }
                        },
                        {
                            "id": "block_pass_q2",
                            "kind": "question",
                            "order": 3,
                            "question": {
                                "id": "q_pass_sa",
                                "type": "short_answer",
                                "text": "Fill in the blank: MFA adds a layer of security because it requires something you know, something you are, and something you ________.",
                                "choices": [],
                                "answer": "have"
                            }
                        }
                    ]
                }
            ]
        },
        {
            "title": "Physical Security in the Workplace",
            "category": "Security",
            "description": "Tailgating prevention, clean desk policy, and securing physical equipment.",
            "estimated_time": "25 mins",
            "difficulty": "Medium",
            "sections": [
                {
                    "id": "sec_phys_1",
                    "title": "Securing the Office Workspace",
                    "order": 1,
                    "collapsed": False,
                    "require_correct_answers": True,
                    "is_optional": False,
                    "min_time_spent": 10,
                    "blocks": [
                        {
                            "id": "block_phys_text",
                            "kind": "text",
                            "order": 1,
                            "content": "Physical security is just as important as digital security. Leaving your laptop unlocked or allowing unauthorized visitors to tailgating into the building can lead to catastrophic data breaches."
                        },
                        {
                            "id": "block_phys_q1",
                            "kind": "question",
                            "order": 2,
                            "question": {
                                "id": "q_phys_tf",
                                "type": "true_false",
                                "text": "Tailgating is when an unauthorized person closely follows an authorized person through a secure door.",
                                "choices": [
                                    {"id": "choice_phys_t", "text": "True", "is_correct": True},
                                    {"id": "choice_phys_f", "text": "False", "is_correct": False}
                                ]
                            }
                        },
                        {
                            "id": "block_phys_q2",
                            "kind": "question",
                            "order": 3,
                            "question": {
                                "id": "q_phys_sa",
                                "type": "short_answer",
                                "text": "What policy requires employees to lock their computers and secure sensitive papers when leaving their desks?",
                                "choices": [],
                                "answer": "Clean desk policy"
                            }
                        }
                    ]
                }
            ]
        },
        {
            "title": "Secure Remote Work Practices",
            "category": "Compliance",
            "description": "Guidelines for secure home Wi-Fi, VPN usage, and mobile device protection.",
            "estimated_time": "30 mins",
            "difficulty": "Medium",
            "sections": [
                {
                    "id": "sec_rem_1",
                    "title": "Best Practices for Home and Public Networks",
                    "order": 1,
                    "collapsed": False,
                    "require_correct_answers": True,
                    "is_optional": False,
                    "min_time_spent": 10,
                    "blocks": [
                        {
                            "id": "block_rem_text",
                            "kind": "text",
                            "order": 1,
                            "content": "Working remotely introduces new attack vectors. Secure Wi-Fi, using VPN connections, and never leaving corporate assets unattended in public spaces are critical remote-work protocols."
                        },
                        {
                            "id": "block_rem_q1",
                            "kind": "question",
                            "order": 2,
                            "question": {
                                "id": "q_rem_mc",
                                "type": "multiple_choice",
                                "text": "What tool should always be used to secure data transit when connecting to home or public Wi-Fi networks?",
                                "choices": [
                                    {"id": "choice_rem_a", "text": "Virtual Private Network (VPN)", "is_correct": True},
                                    {"id": "choice_rem_b", "text": "A faster browser", "is_correct": False},
                                    {"id": "choice_rem_c", "text": "Incognito mode", "is_correct": False}
                                ]
                            }
                        },
                        {
                            "id": "block_rem_q2",
                            "kind": "question",
                            "order": 3,
                            "question": {
                                "id": "q_rem_sa",
                                "type": "short_answer",
                                "text": "What type of connection protocol should be disabled on public Wi-Fi networks to prevent automated sharing?",
                                "choices": [],
                                "answer": "File sharing"
                            }
                        }
                    ]
                }
            ]
        },
        {
            "title": "Data Privacy & GDPR Compliance",
            "category": "Compliance",
            "description": "Understanding personally identifiable information (PII) and maintaining data sovereignty.",
            "estimated_time": "30 mins",
            "difficulty": "Medium",
            "sections": [
                {
                    "id": "sec_priv_1",
                    "title": "Protecting PII & Maintaining Sovereignty",
                    "order": 1,
                    "collapsed": False,
                    "require_correct_answers": True,
                    "is_optional": False,
                    "min_time_spent": 10,
                    "blocks": [
                        {
                            "id": "block_priv_text",
                            "kind": "text",
                            "order": 1,
                            "content": "Personally Identifiable Information (PII) must be safeguarded under laws like GDPR. This requires strict controls on who can access, store, and process sensitive user details."
                        },
                        {
                            "id": "block_priv_q1",
                            "kind": "question",
                            "order": 2,
                            "question": {
                                "id": "q_priv_tf",
                                "type": "true_false",
                                "text": "GDPR only applies to companies physically located within the European Union.",
                                "choices": [
                                    {"id": "choice_priv_t", "text": "True", "is_correct": False},
                                    {"id": "choice_priv_f", "text": "False", "is_correct": True}
                                ]
                            }
                        },
                        {
                            "id": "block_priv_q2",
                            "kind": "question",
                            "order": 3,
                            "question": {
                                "id": "q_priv_sa",
                                "type": "short_answer",
                                "text": "What is the acronym for data that can be used on its own or with other information to identify a single person?",
                                "choices": [],
                                "answer": "PII"
                            }
                        }
                    ]
                }
            ]
        },
        {
            "title": "Incident Reporting & Response",
            "category": "Security",
            "description": "How to spot active malware, ransomware, and report potential security breaches instantly.",
            "estimated_time": "20 mins",
            "difficulty": "Hard",
            "sections": [
                {
                    "id": "sec_inc_1",
                    "title": "Responding to Cyber Incidents",
                    "order": 1,
                    "collapsed": False,
                    "require_correct_answers": True,
                    "is_optional": False,
                    "min_time_spent": 10,
                    "blocks": [
                        {
                            "id": "block_inc_text",
                            "kind": "text",
                            "order": 1,
                            "content": "Early detection and prompt reporting of cybersecurity incidents can prevent minor breaches from turning into severe system compromises."
                        },
                        {
                            "id": "block_inc_q1",
                            "kind": "question",
                            "order": 2,
                            "question": {
                                "id": "q_inc_mc",
                                "type": "multiple_choice",
                                "text": "If you notice suspicious activity or realize you have clicked a questionable link, what should your first action be?",
                                "choices": [
                                    {"id": "choice_inc_a", "text": "Shut down the computer and hope nobody notices.", "is_correct": False},
                                    {"id": "choice_inc_b", "text": "Contact the IT Security Response team immediately.", "is_correct": True},
                                    {"id": "choice_inc_c", "text": "Try to clean the computer using third-party utility software.", "is_correct": False}
                                ]
                            }
                        },
                        {
                            "id": "block_inc_q2",
                            "kind": "question",
                            "order": 3,
                            "question": {
                                "id": "q_inc_sa",
                                "type": "short_answer",
                                "text": "What type of malware restricts access to computer systems and demands a financial payment to unlock them?",
                                "choices": [],
                                "answer": "Ransomware"
                            }
                        }
                    ]
                }
            ]
        }
    ]

    created_modules = {}
    for m in modules_definition:
        r = requests.post(f"{API_URL}/api/modules", json=m, headers=headers_content)
        if r.status_code == 201:
            m_id = r.json().get("id")
            created_modules[m["title"]] = m_id
            print(f"Module '{m['title']}' created successfully (ID: {m_id}).")
        else:
            print(f"Failed to create module '{m['title']}': {r.status_code} {r.text}")

    # Define our courses linking to the created modules
    courses_definition = [
        {
            "title": "Core Security Awareness Essentials",
            "description": "Learn the essential security practices to protect yourself and your organization.",
            "category": "Security",
            "difficulty": "Easy",
            "expected_time": "1 hour",
            "modules_titles": [
                "Introduction to Cybersecurity",
                "Social Engineering and Phishing",
                "Password Security & Multi-Factor Authentication"
            ]
        },
        {
            "title": "Workplace Compliance & Remote Security",
            "description": "Ensure compliance with corporate policies, data privacy guidelines, and best practices for secure remote work.",
            "category": "Compliance",
            "difficulty": "Medium",
            "expected_time": "1.5 hours",
            "modules_titles": [
                "Secure Remote Work Practices",
                "Data Privacy & GDPR Compliance"
            ]
        },
        {
            "title": "Advanced Threat Response & Physical Defenses",
            "description": "Protect the workspace physically and understand the advanced protocols for reporting active security breaches.",
            "category": "Security",
            "difficulty": "Hard",
            "expected_time": "1 hour",
            "modules_titles": [
                "Physical Security in the Workplace",
                "Incident Reporting & Response"
            ]
        }
    ]

    for c in courses_definition:
        # Map titles to the captured ObjectIds
        linked_modules = [created_modules[t] for t in c["modules_titles"] if t in created_modules]
        
        course_payload = {
            "title": c["title"],
            "description": c["description"],
            "category": c["category"],
            "difficulty": c["difficulty"],
            "expected_time": c["expected_time"],
            "modules": linked_modules
        }
        
        r = requests.post(f"{API_URL}/api/courses", json=course_payload, headers=headers_content)
        if r.status_code == 201:
            print(f"Course '{c['title']}' created successfully.")
        else:
            print(f"Failed to create course '{c['title']}': {r.status_code} {r.text}")

    # Email Templates
    email_template = {
        "name": "Password Reset Notice",
        "path": "/templates/emails/",
        "subject": "Important: Reset your password",
        "html": "<html><body><p>Please reset your password by clicking this link: ${{redirect}}</p><img src='${{pixel}}' alt='' /></body></html>"
    }
    r = requests.post(f"{API_URL}/api/templates", json=email_template, headers=headers_content)
    print("Email template created:", r.status_code)

    # Landing Page Templates
    landing_template = {
        "name": "Microsoft 365 Login",
        "path": "/templates/pages/",
        "html": "<html><body><h2>Sign in to your account</h2><form action='${{redirect}}'><input type='email' placeholder='Email' /><br/><button type='submit'>Next</button></form></body></html>"
    }
    r = requests.post(f"{API_URL}/api/templates", json=landing_template, headers=headers_content)
    print("Landing page template created:", r.status_code)

    print("5. Getting org_manager token for 'ua'...")
    org_token = get_keycloak_token("Org_manager", "1234", realm="ua", client_id="react-app")
    headers_org = {"Authorization": f"Bearer {org_token}"}

    print("5b. Creating required groups in Keycloak...")
    required_groups = ["PEI", "group-a", "group-b", "group-admins"]
    for group_name in required_groups:
        r = requests.post(f"{API_URL}/api/org-manager/ua/groups", json={"name": group_name}, headers=headers_org)
        if r.status_code == 201:
            print(f"Group '{group_name}' created successfully.")
        elif r.status_code == 409:
            print(f"Group '{group_name}' already exists.")
        else:
            print(f"Failed to create group '{group_name}': {r.status_code} {r.text}")

    # Fetch groups to get their UUIDs
    r = requests.get(f"{API_URL}/api/org-manager/ua/groups", headers=headers_org)
    if r.status_code == 200:
        groups_list = r.json().get("groups", [])
        groups_map = {g["name"]: g["id"] for g in groups_list}
        print("Fetched group UUIDs mapping:", groups_map)
    else:
        print("Failed to fetch groups:", r.status_code, r.text)
        groups_map = {}

    print("6. Bulk importing users from users.csv...")
    with open("users.csv", "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            group_name = row.get("groups", "").split(",")[0].strip() if row.get("groups") else None
            group_id = groups_map.get(group_name) if group_name else None
            
            # fallback to username@ua.pt if email is empty
            email = row.get("email")
            if not email or not email.strip():
                email = f"{row['username']}@ua.pt"
                
            user_payload = {
                "username": row["username"],
                "name": row["name"],
                "email": email,
                "role": row["role"],
                "group_id": group_id
            }
            r = requests.post(f"{API_URL}/api/org-manager/ua/users", json=user_payload, headers=headers_org)
            if r.status_code == 201 or r.status_code == 200:
                print(f"User {row['username']} created.")
            elif r.status_code == 409:
                print(f"User {row['username']} already exists.")
            else:
                print(f"Failed to create user {row['username']}: {r.status_code} {r.text}")

    print("7. Adding SMTP profiles...")
    sending_profile_ids = []
    # SMTP profile based on env vars
    smtp_env_payload = {
        "name": "Env Vars SMTP",
        "smtp_host": os.getenv("KC_SMTP_HOST", "smtp.gmail.com"),
        "smtp_port": int(os.getenv("KC_SMTP_PORT", 587)),
        "username": os.getenv("KC_SMTP_USER", "default_user"),
        "password": os.getenv("KC_SMTP_PASSWORD", "default_pass").replace("'", ""),
        "from_fname": "IT",
        "from_lname": "Support",
        "from_email": os.getenv("KC_SMTP_FROM", "it@ua.pt")
    }
    r = requests.post(f"{API_URL}/api/sending-profiles", json=smtp_env_payload, headers=headers_org)
    if r.status_code == 201:
        print("SMTP profile (env) created.")
        sending_profile_ids.append(r.json().get("id"))
    else:
        print("Failed to create SMTP profile (env):", r.status_code, r.text)

    # Additional random SMTP profile
    smtp_fake_payload = {
        "name": "Marketing SMTP",
        "smtp_host": "smtp.mailgun.org",
        "smtp_port": 587,
        "username": "marketing@mailgun.org",
        "password": "fake_password",
        "from_fname": "Marketing",
        "from_lname": "Team",
        "from_email": "marketing@ua.pt"
    }
    r = requests.post(f"{API_URL}/api/sending-profiles", json=smtp_fake_payload, headers=headers_org)
    if r.status_code == 201:
        print("SMTP profile (fake) created.")
        sending_profile_ids.append(r.json().get("id"))
    else:
        print("Failed to create SMTP profile (fake):", r.status_code, r.text)

    print("8. Adding a campaign...")
    insert_fake_campaigns(groups_map, sending_profile_ids)

if __name__ == "__main__":
    main()
