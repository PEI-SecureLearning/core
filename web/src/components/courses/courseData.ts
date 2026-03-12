import type { Section } from '@/components/content-manager/modules/module-creation/types'

export type ModuleStatus = 'completed' | 'in-progress' | 'not-started'

export type CourseModule = {
    id: string
    title: string
    description: string
    lessons: number
    labs: number
    hours: string
    difficulty: 'Easy' | 'Medium' | 'Hard'
    completion: number       // 0–100
    status: ModuleStatus
    // Fields for high-fidelity preview
    image?: string
    coverImage?: string
    estimatedTime?: string
    unitCount?: number
    sections?: Section[]
}

export type Course = {
    id: string
    title: string
    description: string
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
    duration: string
    userCount: number
    category: string
    color: string
    icon: string
    modules: CourseModule[]
}

export const COURSES: Course[] = [
    {
        id: '1',
        title: 'Introduction to Cybersecurity',
        description: 'Learn the foundational concepts of cybersecurity, including threat landscapes, security principles, and how to protect digital assets in modern environments.',
        difficulty: 'Beginner',
        duration: '4h 30m',
        userCount: 214,
        category: 'Security Fundamentals',
        color: 'from-violet-600 to-purple-800',
        icon: '🛡️',
        modules: [
            {
                id: '1-1',
                title: 'What is Cybersecurity?',
                description: 'An introduction to the cybersecurity landscape, key definitions, and why security matters in the modern world.',
                lessons: 5,
                labs: 1,
                hours: '1h 00m',
                difficulty: 'Easy',
                completion: 100,
                status: 'completed',
                image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=60',
                coverImage: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=60',
                estimatedTime: '1h 00m',
                unitCount: 5,
                sections: [
                    {
                        id: 's1-1-1', title: 'Foundations of Cyber Defense', collapsed: false,
                        requireCorrectAnswers: true,
                        blocks: [
                            { id: 'b1-1-1', kind: 'text', content: '## What is Cybersecurity?\n\nCybersecurity is the practice of protecting systems, networks, and programs from digital attacks. These cyberattacks are usually aimed at accessing, changing, or destroying sensitive information; extorting money from users; or interrupting normal business processes.\n\n**Key pillars:**\n- **Confidentiality** — Ensuring information is accessible only to those authorized to have access\n- **Integrity** — Safeguarding the accuracy and completeness of information\n- **Availability** — Ensuring that authorized users have access to information when needed\n\n> The CIA triad is the most fundamental model in information security. Every security control should be evaluated against these three principles.' },
                            { id: 'b1-1-2', kind: 'question', question: { id: 'q1-1-1', type: 'multiple_choice', text: 'Which pillar of cybersecurity ensures that data is not altered by unauthorized users?', choices: [{ id: 'c1', text: 'Confidentiality', isCorrect: false }, { id: 'c2', text: 'Integrity', isCorrect: true }, { id: 'c3', text: 'Availability', isCorrect: false }], answer: 'c2' } },
                        ]
                    },
                    {
                        id: 's1-1-2', title: 'The Evolving Threat Landscape', collapsed: false,
                        requireCorrectAnswers: true,
                        blocks: [
                            { id: 'b1-1-3', kind: 'text', content: '## Why Cybersecurity Matters Now\n\nThe digital landscape has evolved dramatically in recent years:\n\n1. **Remote Work Expansion** — The shift to remote work has expanded attack surfaces significantly\n2. **IoT Proliferation** — Billions of connected devices create new vulnerabilities\n3. **Sophisticated Attacks** — Attackers use AI, automation, and advanced tactics\n4. **Regulatory Pressure** — GDPR, HIPAA, PCI-DSS and other regulations mandate security controls\n\n### The Cost of a Breach\n\nAccording to IBM\'s Cost of a Data Breach Report, the average cost of a data breach in 2024 was **$4.88 million**. This includes:\n- Detection and escalation costs\n- Notification costs\n- Post-breach response\n- Lost business' },
                            { id: 'b1-1-4', kind: 'question', question: { id: 'q1-1-2', type: 'multiple_choice', text: 'What is the primary reason cybersecurity has become more critical in recent years?', choices: [{ id: 'c4', text: 'Hardware has become cheaper', isCorrect: false }, { id: 'c5', text: 'The attack surface has expanded due to remote work, IoT, and cloud', isCorrect: true }, { id: 'c6', text: 'Fewer regulations exist', isCorrect: false }, { id: 'c7', text: 'Attacks are becoming simpler', isCorrect: false }], answer: 'c5' } },
                        ]
                    },
                    {
                        id: 's1-1-3', title: 'Career Paths in Cybersecurity (Optional)', collapsed: false,
                        isOptional: true,
                        blocks: [
                            { id: 'b1-1-5', kind: 'text', content: '## Cybersecurity Career Paths\n\nCybersecurity offers diverse career opportunities:\n\n| Role | Focus Area | Avg Salary |\n|---|---|---|\n| Security Analyst | Monitoring & incident response | $75,000 |\n| Penetration Tester | Offensive security testing | $95,000 |\n| Security Architect | Designing secure systems | $130,000 |\n| CISO | Strategic security leadership | $180,000 |\n\n> **Tip:** Start with a Security+ certification to get your foot in the door!' },
                        ]
                    },
                    {
                        id: 's1-1-4', title: 'Section Assessment', collapsed: false,
                        requireCorrectAnswers: true,
                        blocks: [
                            { id: 'b1-1-6', kind: 'text', content: '## Module Assessment\n\nTest your understanding of cybersecurity fundamentals with the following questions.' },
                            { id: 'b1-1-7', kind: 'question', question: { id: 'q1-1-3', type: 'true_false', text: 'The CIA triad stands for Confidentiality, Integrity, and Availability.', choices: [{ id: 'tf-t1', text: 'True', isCorrect: true }, { id: 'tf-f1', text: 'False', isCorrect: false }], answer: 'tf-t1' } },
                            { id: 'b1-1-8', kind: 'question', question: { id: 'q1-1-4', type: 'multiple_choice', text: 'Which of the following is NOT a common cybersecurity career path?', choices: [{ id: 'c8', text: 'Penetration Tester', isCorrect: false }, { id: 'c9', text: 'Security Architect', isCorrect: false }, { id: 'c10', text: 'Data Entry Clerk', isCorrect: true }, { id: 'c11', text: 'Security Analyst', isCorrect: false }], answer: 'c10' } },
                        ]
                    },
                ]
            },
            {
                id: '1-2',
                title: 'Threat Actors & Motivations',
                description: 'Explore who carries out attacks, their motivations, and the categories of threats organizations face daily.',
                lessons: 4,
                labs: 1,
                hours: '45m',
                difficulty: 'Easy',
                completion: 100,
                status: 'completed',
                image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=60',
                coverImage: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=60',
                estimatedTime: '45m',
                unitCount: 4,
                sections: [
                    {
                        id: 's1-2-1', title: 'Know Your Enemy', collapsed: false,
                        requireCorrectAnswers: true,
                        blocks: [
                            { id: 'b1-2-1', kind: 'text', content: '## Common Threat Actors\n\n1. **Cybercriminals** — Motivated primarily by financial gain. They use ransomware, phishing, and fraud.\n2. **State-Sponsored Actors** — Motivated by espionage or strategic advantage. They target critical infrastructure and intellectual property.\n3. **Hacktivists** — Motivated by social or political causes. They use DDoS attacks and website defacement.\n4. **Insider Threats** — Employees or partners with authorized access who cause harm, either maliciously or accidentally.' },
                            { id: 'b1-2-2', kind: 'question', question: { id: 'q1-2-1', type: 'true_false', text: 'Hacktivists are primarily motivated by financial gain.', choices: [{ id: 'tf-t', text: 'True', isCorrect: false }, { id: 'tf-f', text: 'False', isCorrect: true }], answer: 'tf-f' } },
                        ]
                    },
                    {
                        id: 's1-2-2', title: 'Attack Vectors & Techniques', collapsed: false,
                        requireCorrectAnswers: true,
                        blocks: [
                            { id: 'b1-2-3', kind: 'text', content: '## Common Attack Vectors\n\nThreat actors use many techniques to compromise targets:\n\n### Social Engineering\nManipulating people into divulging confidential information or performing actions. **Phishing** is the most common form.\n\n### Malware\n- **Ransomware** — Encrypts files and demands payment\n- **Trojans** — Disguised as legitimate software\n- **Worms** — Self-replicating across networks\n\n### Exploitation\n- **Zero-day exploits** — Attacks on unknown vulnerabilities\n- **Supply chain attacks** — Compromising trusted vendors\n\n### Credential Attacks\n- **Brute force** — Guessing passwords systematically\n- **Credential stuffing** — Using leaked credentials' },
                            { id: 'b1-2-4', kind: 'question', question: { id: 'q1-2-2', type: 'multiple_choice', text: 'What type of malware encrypts your files and demands payment for the decryption key?', choices: [{ id: 'av1', text: 'Trojan', isCorrect: false }, { id: 'av2', text: 'Worm', isCorrect: false }, { id: 'av3', text: 'Ransomware', isCorrect: true }, { id: 'av4', text: 'Adware', isCorrect: false }], answer: 'av3' } },
                            { id: 'b1-2-5', kind: 'question', question: { id: 'q1-2-3', type: 'multiple_choice', text: 'Which attack technique involves compromising a trusted software vendor to distribute malicious updates?', choices: [{ id: 'av5', text: 'Phishing', isCorrect: false }, { id: 'av6', text: 'Supply chain attack', isCorrect: true }, { id: 'av7', text: 'Brute force', isCorrect: false }, { id: 'av8', text: 'DDoS', isCorrect: false }], answer: 'av6' } },
                        ]
                    },
                    {
                        id: 's1-2-3', title: 'Real-World Case Studies (Optional)', collapsed: false,
                        isOptional: true,
                        blocks: [
                            { id: 'b1-2-6', kind: 'text', content: '## Notable Cyber Attacks\n\n### SolarWinds Supply Chain Attack (2020)\nState-sponsored attackers compromised SolarWinds\' Orion software build system, affecting ~18,000 organizations including US government agencies.\n\n### WannaCry Ransomware (2017)\nExploited EternalBlue (MS17-010) to spread across 150 countries in hours. Encrypted files on 230,000+ computers, demanding Bitcoin ransoms.\n\n### Colonial Pipeline (2021)\nA ransomware attack on the largest fuel pipeline in the US caused fuel shortages across the East Coast. The company paid $4.4M in Bitcoin ransom.' },
                        ]
                    },
                ]
            },
            {
                id: '1-3',
                title: 'Security Principles & Frameworks',
                description: 'Learn about the CIA triad, defence in depth, and widely adopted security frameworks like NIST and ISO 27001.',
                lessons: 6,
                labs: 2,
                hours: '1h 15m',
                difficulty: 'Easy',
                completion: 60,
                status: 'in-progress',
                image: 'https://images.unsplash.com/photo-1510511459019-5dee224ffb8b?w=800&auto=format&fit=crop&q=60',
                coverImage: 'https://images.unsplash.com/photo-1510511459019-5dee224ffb8b?w=800&auto=format&fit=crop&q=60',
                estimatedTime: '1h 15m',
                unitCount: 6,
                sections: [
                    {
                        id: 's1-3-1', title: 'The CIA Triad in Depth', collapsed: false,
                        requireCorrectAnswers: true,
                        blocks: [
                            { id: 'b1-3-1', kind: 'text', content: '## Confidentiality, Integrity, Availability\n\nThese three principles form the bedrock of cybersecurity. Every security measure should be measured against how well it protects these values.\n\n### Confidentiality\nEnsuring that information is accessible only to those authorized. Controls include:\n- Encryption (AES-256, RSA)\n- Access control lists (ACLs)\n- Data classification schemes\n\n### Integrity\nSafeguarding the accuracy and completeness of data. Controls include:\n- Hashing (SHA-256)\n- Digital signatures\n- Version control\n\n### Availability\nEnsuring systems are operational when needed. Controls include:\n- Redundancy and failover\n- Load balancing\n- DDoS mitigation' },
                            { id: 'b1-3-2', kind: 'question', question: { id: 'q1-3-1', type: 'multiple_choice', text: 'Which CIA triad component is most directly addressed by implementing encryption?', choices: [{ id: 'cia1', text: 'Confidentiality', isCorrect: true }, { id: 'cia2', text: 'Integrity', isCorrect: false }, { id: 'cia3', text: 'Availability', isCorrect: false }], answer: 'cia1' } },
                        ]
                    },
                    {
                        id: 's1-3-2', title: 'Defence in Depth', collapsed: false,
                        requireCorrectAnswers: true,
                        blocks: [
                            { id: 'b1-3-3', kind: 'text', content: '## Layered Security Model\n\nDefence in depth uses multiple layers of security controls:\n\n1. **Physical** — Locks, cameras, guards\n2. **Network** — Firewalls, IDS/IPS, segmentation\n3. **Host** — Antivirus, patching, hardening\n4. **Application** — Secure coding, WAF, input validation\n5. **Data** — Encryption, DLP, backups\n6. **User** — Training, MFA, least privilege\n\n> If one layer fails, the next layer still provides protection.' },
                            { id: 'b1-3-4', kind: 'question', question: { id: 'q1-3-2', type: 'true_false', text: 'Defence in depth relies on a single, strong perimeter defence.', choices: [{ id: 'dd-t', text: 'True', isCorrect: false }, { id: 'dd-f', text: 'False', isCorrect: true }], answer: 'dd-f' } },
                        ]
                    },
                    {
                        id: 's1-3-3', title: 'NIST & ISO Frameworks', collapsed: false,
                        blocks: [
                            { id: 'b1-3-5', kind: 'text', content: '## Industry Frameworks\n\n### NIST Cybersecurity Framework\nFive core functions:\n- **Identify** — Understand your assets and risks\n- **Protect** — Implement safeguards\n- **Detect** — Monitor for threats\n- **Respond** — Act on detected incidents\n- **Recover** — Restore normal operations\n\n### ISO 27001\nInternational standard for Information Security Management Systems (ISMS). Provides a systematic approach to managing sensitive company information.' },
                            { id: 'b1-3-6', kind: 'question', question: { id: 'q1-3-3', type: 'multiple_choice', text: 'Which NIST CSF function involves understanding your organization\'s assets and risks?', choices: [{ id: 'nist1', text: 'Protect', isCorrect: false }, { id: 'nist2', text: 'Identify', isCorrect: true }, { id: 'nist3', text: 'Detect', isCorrect: false }, { id: 'nist4', text: 'Respond', isCorrect: false }], answer: 'nist2' } },
                        ]
                    },
                ]
            },
            {
                id: '1-4',
                title: 'Protecting Digital Assets',
                description: 'Practical techniques for protecting data, devices, and accounts at an individual and organizational level.',
                lessons: 5,
                labs: 2,
                hours: '1h 00m',
                difficulty: 'Medium',
                completion: 0,
                status: 'not-started',
                image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=60',
                coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=60',
                estimatedTime: '1h 00m',
                unitCount: 5,
                sections: [
                    {
                        id: 's1-4-1', title: 'Endpoint Security', collapsed: false,
                        requireCorrectAnswers: true,
                        blocks: [
                            { id: 'b1-4-1', kind: 'text', content: '## Encryption and MFA\n\nProtecting endpoints is the first line of defense.\n\n### Full Disk Encryption\nEncrypt the entire hard drive so data cannot be read if the device is stolen. Tools:\n- **BitLocker** (Windows)\n- **FileVault** (macOS)\n- **LUKS** (Linux)\n\n### Multi-Factor Authentication (MFA)\nRequire two or more verification factors:\n- Something you **know** (password)\n- Something you **have** (phone, hardware key)\n- Something you **are** (fingerprint, face scan)' },
                            { id: 'b1-4-2', kind: 'question', question: { id: 'q1-4-1', type: 'multiple_choice', text: 'Which of the following is an example of "something you have" in MFA?', choices: [{ id: 'mfa1', text: 'A password', isCorrect: false }, { id: 'mfa2', text: 'A hardware security key', isCorrect: true }, { id: 'mfa3', text: 'A fingerprint', isCorrect: false }], answer: 'mfa2' } },
                        ]
                    },
                    {
                        id: 's1-4-2', title: 'Password Management', collapsed: false,
                        requireCorrectAnswers: true,
                        blocks: [
                            { id: 'b1-4-3', kind: 'text', content: '## Strong Password Practices\n\n- Use a **password manager** (Bitwarden, 1Password)\n- Generate passwords at least **16 characters** long\n- Never reuse passwords across sites\n- Enable **MFA** on every account that supports it\n\n### Passkeys\nThe industry is moving toward **passwordless authentication** using passkeys (FIDO2/WebAuthn). These use public-key cryptography and are phishing-resistant.' },
                            { id: 'b1-4-4', kind: 'question', question: { id: 'q1-4-2', type: 'true_false', text: 'It is safe to reuse the same password across multiple accounts if the password is strong.', choices: [{ id: 'pw-t', text: 'True', isCorrect: false }, { id: 'pw-f', text: 'False', isCorrect: true }], answer: 'pw-f' } },
                        ]
                    },
                ]
            },
            {
                id: '1-5',
                title: 'Assessment & Certification',
                description: 'Test your understanding with a final assessment covering all topics from this course.',
                lessons: 1,
                labs: 0,
                hours: '30m',
                difficulty: 'Medium',
                completion: 0,
                status: 'not-started',
                image: 'https://images.unsplash.com/photo-1454165833744-80e92246f21d?w=800&auto=format&fit=crop&q=60',
                coverImage: 'https://images.unsplash.com/photo-1454165833744-80e92246f21d?w=800&auto=format&fit=crop&q=60',
                estimatedTime: '30m',
                unitCount: 1,
                sections: [
                    {
                        id: 's1-5-1', title: 'Final Quiz', collapsed: false,
                        requireCorrectAnswers: true,
                        blocks: [
                            { id: 'b1-5-1', kind: 'text', content: '## Prove Your Knowledge\n\nComplete this assessment to earn your "Introduction to Cybersecurity" completion badge.' },
                            { id: 'b1-5-2', kind: 'question', question: { id: 'q1-5-1', type: 'multiple_choice', text: 'What does the "A" in the CIA triad stand for?', choices: [{ id: 'fin1', text: 'Authentication', isCorrect: false }, { id: 'fin2', text: 'Authorization', isCorrect: false }, { id: 'fin3', text: 'Availability', isCorrect: true }, { id: 'fin4', text: 'Accountability', isCorrect: false }], answer: 'fin3' } },
                            { id: 'b1-5-3', kind: 'question', question: { id: 'q1-5-2', type: 'true_false', text: 'A zero-day exploit targets a vulnerability that is already known and patched.', choices: [{ id: 'fin-t', text: 'True', isCorrect: false }, { id: 'fin-f', text: 'False', isCorrect: true }], answer: 'fin-f' } },
                        ]
                    }
                ]
            },
        ],
    },
    {
        id: '2',
        title: 'Phishing Awareness & Defense',
        description: 'Understand how phishing attacks work, learn to identify social engineering tactics, and build habits to protect yourself and your organization from credential theft.',
        difficulty: 'Beginner',
        duration: '2h 15m',
        userCount: 389,
        category: 'Social Engineering',
        color: 'from-rose-600 to-red-800',
        icon: '🎣',
        modules: [
            {
                id: '2-1',
                title: 'Anatomy of a Phishing Attack',
                description: 'Break down a real phishing campaign end-to-end: lures, landing pages, credential harvesting, and persistence.',
                lessons: 4,
                labs: 1,
                hours: '40m',
                difficulty: 'Easy',
                completion: 100,
                status: 'completed',
                image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=60',
                coverImage: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=60',
                estimatedTime: '40m',
                unitCount: 4,
                sections: [{ id: 's2-1-1', title: 'Phishing Mechanics', collapsed: false, blocks: [{ id: 'b2-1-1', kind: 'text', content: '## How Phishing Works\n\nPhishing is a social engineering attack where an attacker sends a fraudulent message designed to trick a person into revealing sensitive information.' }] }]
            },
            {
                id: '2-2',
                title: 'Identifying Red Flags',
                description: 'Practical exercises to spot suspicious emails, spoofed domains, and social engineering attempts before they succeed.',
                lessons: 5,
                labs: 2,
                hours: '50m',
                difficulty: 'Easy',
                completion: 75,
                status: 'in-progress',
                image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=60',
                coverImage: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=60',
                estimatedTime: '50m',
                unitCount: 5,
                sections: [{ id: 's2-2-1', title: 'Visual Inspection', collapsed: false, blocks: [{ id: 'b2-2-1', kind: 'text', content: '## Spotting the Fake\n\nLearn to look for spoofed sender addresses, urgent language, and suspicious links.' }] }]
            },
            {
                id: '2-3',
                title: 'Reporting & Response',
                description: 'How to report suspected phishing internally and the steps to follow if you\'ve already clicked a malicious link.',
                lessons: 3,
                labs: 1,
                hours: '45m',
                difficulty: 'Easy',
                completion: 0,
                status: 'not-started',
                image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=60',
                coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=60',
                estimatedTime: '45m',
                unitCount: 3,
                sections: [{ id: 's2-3-1', title: 'Incident Response', collapsed: false, blocks: [{ id: 'b2-3-1', kind: 'text', content: '## Taking Action\n\nReporting phishing attempts helps protect the entire organization.' }] }]
            },
        ],
    },
    {
        id: '3',
        title: 'Network Security Essentials',
        description: 'Explore core network security concepts including firewalls, VPNs, intrusion detection systems, and best practices for securing organizational infrastructure.',
        difficulty: 'Intermediate',
        duration: '6h 00m',
        userCount: 132,
        category: 'Networking',
        color: 'from-blue-600 to-indigo-800',
        icon: '🔗',
        modules: [
            {
                id: '3-1',
                title: 'Network Fundamentals Recap',
                description: 'A refresher on OSI model, TCP/IP, subnetting, and packet flow — the foundation for everything that follows.',
                lessons: 5,
                labs: 2,
                hours: '1h 30m',
                difficulty: 'Easy',
                completion: 100,
                status: 'completed',
                image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=60',
                coverImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=60',
                estimatedTime: '1h 30m',
                unitCount: 5,
                sections: [{ id: 's3-1-1', title: 'Network Layers', collapsed: false, blocks: [{ id: 'b3-1-1', kind: 'text', content: '## OSI Model Review\n\nUnderstanding data flow through the 7 layers of the OSI model.' }] }]
            },
            {
                id: '3-2',
                title: 'Firewalls & Access Control',
                description: 'Configure stateful firewalls, ACLs, and DMZ architectures to enforce least-privilege network access.',
                lessons: 6,
                labs: 3,
                hours: '1h 30m',
                difficulty: 'Medium',
                completion: 100,
                status: 'completed',
                image: 'https://images.unsplash.com/photo-1510511459019-5dee224ffb8b?w=800&auto=format&fit=crop&q=60',
                coverImage: 'https://images.unsplash.com/photo-1510511459019-5dee224ffb8b?w=800&auto=format&fit=crop&q=60',
                estimatedTime: '1h 30m',
                unitCount: 6,
                sections: [{ id: 's3-2-1', title: 'Perimeter Defense', collapsed: false, blocks: [{ id: 'b3-2-1', kind: 'text', content: '## Firewall Rules\n\nDefining inbound and outbound traffic policies.' }] }]
            },
            {
                id: '3-3',
                title: 'VPNs & Encrypted Tunnels',
                description: 'Deploy and troubleshoot IPsec and TLS-based VPNs for secure remote access and site-to-site connectivity.',
                lessons: 5,
                labs: 2,
                hours: '1h 15m',
                difficulty: 'Medium',
                completion: 45,
                status: 'in-progress',
                image: 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=800&auto=format&fit=crop&q=60',
                coverImage: 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=800&auto=format&fit=crop&q=60',
                estimatedTime: '1h 15m',
                unitCount: 5,
                sections: [{ id: 's3-3-1', title: 'Secure Tunnels', collapsed: false, blocks: [{ id: 'b3-3-1', kind: 'text', content: '## VPN Protocols\n\nComparing IPsec, OpenVPN, and WireGuard.' }] }]
            },
            {
                id: '3-4',
                title: 'Intrusion Detection & Prevention',
                description: 'Set up and tune IDS/IPS solutions, understand signature vs. behavioural detection, and handle alerts.',
                lessons: 4,
                labs: 2,
                hours: '1h 00m',
                difficulty: 'Hard',
                completion: 0,
                status: 'not-started',
                image: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800&auto=format&fit=crop&q=60',
                coverImage: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800&auto=format&fit=crop&q=60',
                estimatedTime: '1h 00m',
                unitCount: 4,
                sections: [{ id: 's3-4-1', title: 'Detection Logic', collapsed: false, blocks: [{ id: 'b3-4-1', kind: 'text', content: '## Signature vs Anomaly\n\nHow modern IDS systems identify threats.' }] }]
            },
            {
                id: '3-5',
                title: 'Network Monitoring & Hardening',
                description: 'Apply CIS benchmarks, monitor traffic with NetFlow, and use SIEM integration to detect anomalies.',
                lessons: 4,
                labs: 2,
                hours: '45m',
                difficulty: 'Hard',
                completion: 0,
                status: 'not-started',
                image: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&auto=format&fit=crop&q=60',
                coverImage: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&auto=format&fit=crop&q=60',
                estimatedTime: '45m',
                unitCount: 4,
                sections: [{ id: 's3-5-1', title: 'Hardening', collapsed: false, blocks: [{ id: 'b3-5-1', kind: 'text', content: '## Continuous Monitoring\n\nMaintaining a secure network posture.' }] }]
            },
        ],
    },
    {
        id: '4',
        title: 'Secure Coding Practices',
        description: 'Learn how to write secure code by understanding common vulnerabilities like SQL injection, XSS, and CSRF, and how to defend against them using industry best practices.',
        difficulty: 'Intermediate',
        duration: '5h 45m',
        userCount: 98,
        category: 'Development',
        color: 'from-emerald-600 to-teal-800',
        icon: '💻',
        modules: [
            {
                id: '4-1',
                title: 'OWASP Top 10 Overview',
                description: 'Survey the ten most critical web application security risks with real-world examples and mitigation strategies.',
                lessons: 5,
                labs: 1,
                hours: '1h 00m',
                difficulty: 'Easy',
                completion: 100,
                status: 'completed',
                image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=60',
                coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=60',
                estimatedTime: '1h 00m',
                unitCount: 5,
                sections: [{ id: 's4-1-1', title: 'Web App Risks', collapsed: false, blocks: [{ id: 'b4-1-1', kind: 'text', content: '## OWASP Top 10\n\nThe standard awareness document for developers and web application security.' }] }]
            },
            {
                id: '4-2',
                title: 'Injection Attacks',
                description: 'Deep-dive into SQL, command, and LDAP injection — exploit them in a lab environment, then learn to prevent them.',
                lessons: 6,
                labs: 3,
                hours: '1h 30m',
                difficulty: 'Medium',
                completion: 30,
                status: 'in-progress',
                image: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&auto=format&fit=crop&q=60',
                coverImage: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&auto=format&fit=crop&q=60',
                estimatedTime: '1h 30m',
                unitCount: 6,
                sections: [{ id: 's4-2-1', title: 'SQL Injection', collapsed: false, blocks: [{ id: 'b4-2-1', kind: 'text', content: '## Breaking Databases\n\nHow improper input handling leads to data leaks.' }] }]
            },
            {
                id: '4-3',
                title: 'XSS & CSRF',
                description: 'Understand reflected, stored, and DOM-based XSS alongside CSRF attacks, and implement robust defences.',
                lessons: 5,
                labs: 2,
                hours: '1h 15m',
                difficulty: 'Medium',
                completion: 0,
                status: 'not-started',
                image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=60',
                coverImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=60',
                estimatedTime: '1h 15m',
                unitCount: 5,
                sections: [{ id: 's4-3-1', title: 'Cross-Site Attacks', collapsed: false, blocks: [{ id: 'b4-3-1', kind: 'text', content: '## Browser Exploits\n\nDefending the client-side environment.' }] }]
            },
            {
                id: '4-4',
                title: 'Authentication & Session Management',
                description: 'Implement secure authentication flows, session tokens, and MFA to eliminate common account-takeover vectors.',
                lessons: 4,
                labs: 2,
                hours: '1h 00m',
                difficulty: 'Hard',
                completion: 0,
                status: 'not-started',
                image: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800&auto=format&fit=crop&q=60',
                coverImage: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800&auto=format&fit=crop&q=60',
                estimatedTime: '1h 00m',
                unitCount: 4,
                sections: [{ id: 's4-4-1', title: 'Secure Login', collapsed: false, blocks: [{ id: 'b4-4-1', kind: 'text', content: '## Session Security\n\nBest practices for tokens and MFA.' }] }]
            },
            {
                id: '4-5',
                title: 'Dependency & Supply Chain Security',
                description: 'Audit third-party libraries, use SBOMs, and integrate SCA tooling into your CI/CD pipeline.',
                lessons: 3,
                labs: 1,
                hours: '1h 00m',
                difficulty: 'Hard',
                completion: 0,
                status: 'not-started',
                image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=60',
                coverImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=60',
                estimatedTime: '1h 00m',
                unitCount: 3,
                sections: [{ id: 's4-5-1', title: 'Supply Chain', collapsed: false, blocks: [{ id: 'b4-5-1', kind: 'text', content: '## Third-Party Risks\n\nAuditing dependencies and using SBOMs.' }] }]
            },
        ],
    },
    {
        id: '5',
        title: 'Data Privacy & GDPR Compliance',
        description: 'Gain a comprehensive understanding of data privacy regulations, how GDPR affects your organization, and practical steps to ensure compliance and protect user data.',
        difficulty: 'Beginner',
        duration: '3h 00m',
        userCount: 451,
        category: 'Compliance',
        color: 'from-amber-500 to-orange-700',
        icon: '📋',
        modules: [
            {
                id: '5-1',
                title: 'Introduction to Data Privacy',
                description: 'Foundational principles of data privacy, the difference between privacy and security, and why it matters for organizations.',
                lessons: 4,
                labs: 0,
                hours: '45m',
                difficulty: 'Easy',
                completion: 100,
                status: 'completed',
                image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&auto=format&fit=crop&q=60',
                coverImage: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&auto=format&fit=crop&q=60',
                estimatedTime: '45m',
                unitCount: 4,
                sections: [{ id: 's5-1-1', title: 'Privacy Foundations', collapsed: false, blocks: [{ id: 'b5-1-1', kind: 'text', content: '## Why Privacy Matters\n\nUnderstanding the legal and ethical landscapes of data protection.' }] }]
            },
            {
                id: '5-2',
                title: 'GDPR Key Principles',
                description: 'Unpack the seven GDPR principles, lawful bases for processing, and what each means in practice for your team.',
                lessons: 5,
                labs: 0,
                hours: '1h 00m',
                difficulty: 'Easy',
                completion: 100,
                status: 'completed',
                image: 'https://images.unsplash.com/photo-1589232390623-2e228ec535e6?w=800&auto=format&fit=crop&q=60',
                coverImage: 'https://images.unsplash.com/photo-1589232390623-2e228ec535e6?w=800&auto=format&fit=crop&q=60',
                estimatedTime: '1h 00m',
                unitCount: 5,
                sections: [{ id: 's5-2-1', title: 'GDPR Rules', collapsed: false, blocks: [{ id: 'b5-2-1', kind: 'text', content: '## The Seven Principles\n\nLawfulness, fairness, transparency, and more.' }] }]
            },
            {
                id: '5-3',
                title: 'Data Subject Rights & Breach Notification',
                description: 'Implement processes for handling data access requests, right-to-erasure, and mandatory breach reporting obligations.',
                lessons: 4,
                labs: 1,
                hours: '1h 15m',
                difficulty: 'Medium',
                completion: 20,
                status: 'in-progress',
                image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=60',
                coverImage: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=60',
                estimatedTime: '1h 15m',
                unitCount: 4,
                sections: [{ id: 's5-3-1', title: 'Compliance Ops', collapsed: false, blocks: [{ id: 'b5-3-1', kind: 'text', content: '## Handling Breaches\n\nThe 72-hour notification rule and subject access requests.' }] }]
            },
        ],
    },
    {
        id: '6',
        title: 'Incident Response & Forensics',
        description: 'Develop skills to effectively respond to security incidents: from detection and containment to investigation, evidence collection, and post-incident recovery.',
        difficulty: 'Advanced',
        duration: '8h 30m',
        userCount: 67,
        category: 'Incident Response',
        color: 'from-sky-600 to-cyan-800',
        icon: '🔍',
        modules: [
            {
                id: '6-1',
                title: 'IR Lifecycle & Team Roles',
                description: 'Understand NIST\'s incident response lifecycle and how to structure an effective computer security incident response team (CSIRT).',
                lessons: 4,
                labs: 1,
                hours: '1h 00m',
                difficulty: 'Medium',
                completion: 100,
                status: 'completed',
                image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=60',
                coverImage: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=60',
                estimatedTime: '1h 00m',
                unitCount: 4,
                sections: [{ id: 's6-1-1', title: 'IR Ready', collapsed: false, blocks: [{ id: 'b6-1-1', kind: 'text', content: '## Building the Team\n\nHow to structure a CSIRT.' }] }]
            },
            {
                id: '6-2',
                title: 'Detection & Triage',
                description: 'Use SIEM alerts, endpoint telemetry, and threat intelligence feeds to detect, categorize, and prioritize incidents.',
                lessons: 5,
                labs: 2,
                hours: '1h 30m',
                difficulty: 'Hard',
                completion: 80,
                status: 'in-progress',
                image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=60',
                coverImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=60',
                estimatedTime: '1h 30m',
                unitCount: 5,
                sections: [{ id: 's6-2-1', title: 'SIEM Ops', collapsed: false, blocks: [{ id: 'b6-2-1', kind: 'text', content: '## Filtering Noise\n\nFinding the needle in the haystack.' }] }]
            },
            {
                id: '6-3',
                title: 'Containment & Eradication',
                description: 'Apply network isolation, account remediation, and malware removal techniques to stop an active incident.',
                lessons: 5,
                labs: 3,
                hours: '2h 00m',
                difficulty: 'Hard',
                completion: 0,
                status: 'not-started',
                image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=60',
                coverImage: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=60',
                estimatedTime: '2h 00m',
                unitCount: 5,
                sections: [{ id: 's6-3-1', title: 'Containment', collapsed: false, blocks: [{ id: 'b6-3-1', kind: 'text', content: '## Stopping the Bleeding\n\nIsolation strategies for compromised hosts.' }] }]
            },
            {
                id: '6-4',
                title: 'Digital Forensics Fundamentals',
                description: 'Collect and preserve forensic evidence from memory, disk, and network captures while maintaining chain of custody.',
                lessons: 6,
                labs: 3,
                hours: '2h 30m',
                difficulty: 'Hard',
                completion: 0,
                status: 'not-started',
                image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=60',
                coverImage: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=60',
                estimatedTime: '2h 30m',
                unitCount: 6,
                sections: [{ id: 's6-4-1', title: 'Evidence Collection', collapsed: false, blocks: [{ id: 'b6-4-1', kind: 'text', content: '## Forensic Artifacts\n\nMemory dumps and disk images.' }] }]
            },
            {
                id: '6-5',
                title: 'Post-Incident Review',
                description: 'Conduct blameless post-mortems, produce incident reports, and apply lessons learned to prevent recurrence.',
                lessons: 3,
                labs: 1,
                hours: '1h 30m',
                difficulty: 'Medium',
                completion: 0,
                status: 'not-started',
                image: 'https://images.unsplash.com/photo-1454165833744-80e92246f21d?w=800&auto=format&fit=crop&q=60',
                coverImage: 'https://images.unsplash.com/photo-1454165833744-80e92246f21d?w=800&auto=format&fit=crop&q=60',
                estimatedTime: '1h 30m',
                unitCount: 3,
                sections: [{ id: 's6-5-1', title: 'Lessons Learned', collapsed: false, blocks: [{ id: 'b6-5-1', kind: 'text', content: '## Closing the Loop\n\nImproving security through post-incident analysis.' }] }]
            },
        ],
    },
    {
        id: '7',
        title: 'Cloud Security Fundamentals',
        description: 'Understand the shared responsibility model, the most common cloud misconfigurations, and how to secure workloads across AWS, Azure, and Google Cloud environments.',
        difficulty: 'Intermediate',
        duration: '5h 15m',
        userCount: 176,
        category: 'Cloud',
        color: 'from-fuchsia-600 to-pink-800',
        icon: '☁️',
        modules: [
            {
                id: '7-1',
                title: 'Shared Responsibility Model',
                description: 'Clarify the boundaries between cloud provider and customer security obligations across IaaS, PaaS, and SaaS.',
                lessons: 3,
                labs: 0,
                hours: '45m',
                difficulty: 'Easy',
                completion: 100,
                status: 'completed',
                image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=60',
                coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=60',
                estimatedTime: '45m',
                unitCount: 3,
                sections: [{ id: 's7-1-1', title: 'Cloud Boundaries', collapsed: false, blocks: [{ id: 'b7-1-1', kind: 'text', content: '## Who Protects What?\n\nIaaS, PaaS, and SaaS security roles.' }] }]
            },
            {
                id: '7-2',
                title: 'Identity & Access Management in the Cloud',
                description: 'Configure IAM policies, service accounts, and role-based access control correctly to prevent privilege escalation.',
                lessons: 5,
                labs: 2,
                hours: '1h 15m',
                difficulty: 'Medium',
                completion: 50,
                status: 'in-progress',
                image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=60',
                coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=60',
                estimatedTime: '1h 15m',
                unitCount: 5,
                sections: [{ id: 's7-2-1', title: 'Cloud IAM', collapsed: false, blocks: [{ id: 'b7-2-1', kind: 'text', content: '## Least Privilege\n\nConfiguring secure cloud identities.' }] }]
            },
            {
                id: '7-3',
                title: 'Storage & Data Security',
                description: 'Avoid common S3/blob misconfiguration pitfalls, apply encryption at rest and in transit, and audit access logs.',
                lessons: 4,
                labs: 2,
                hours: '1h 00m',
                difficulty: 'Medium',
                completion: 0,
                status: 'not-started',
                image: 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=800&auto=format&fit=crop&q=60',
                coverImage: 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=800&auto=format&fit=crop&q=60',
                estimatedTime: '1h 00m',
                unitCount: 4,
                sections: [{ id: 's7-3-1', title: 'Cloud Storage', collapsed: false, blocks: [{ id: 'b7-3-1', kind: 'text', content: '## Securing Buckets\n\nPreventing data leaks in cloud storage.' }] }]
            },
            {
                id: '7-4',
                title: 'Container & Serverless Security',
                description: 'Harden Docker images, Kubernetes clusters, and serverless functions against common attack techniques.',
                lessons: 5,
                labs: 3,
                hours: '1h 30m',
                difficulty: 'Hard',
                completion: 0,
                status: 'not-started',
                image: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&auto=format&fit=crop&q=60',
                coverImage: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&auto=format&fit=crop&q=60',
                estimatedTime: '1h 30m',
                unitCount: 5,
                sections: [{ id: 's7-4-1', title: 'K8s Security', collapsed: false, blocks: [{ id: 'b7-4-1', kind: 'text', content: '## Cluster Hardening\n\nBest practices for container orchestration.' }] }]
            },
            {
                id: '7-5',
                title: 'Cloud Security Posture Management',
                description: 'Use CSPM tools to continuously detect drift, enforce guardrails, and maintain compliance across multi-cloud environments.',
                lessons: 3,
                labs: 1,
                hours: '45m',
                difficulty: 'Hard',
                completion: 0,
                status: 'not-started',
                image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&auto=format&fit=crop&q=60',
                coverImage: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&auto=format&fit=crop&q=60',
                estimatedTime: '45m',
                unitCount: 3,
                sections: [{ id: 's7-5-1', title: 'CSPM', collapsed: false, blocks: [{ id: 'b7-5-1', kind: 'text', content: '## Compliance Monitoring\n\nContinuously auditing your cloud environment.' }] }]
            },
        ],
    },
    {
        id: '8',
        title: 'Penetration Testing Basics',
        description: 'Get hands-on with ethical hacking methodologies. Learn reconnaissance, vulnerability assessment, exploitation techniques, and responsible disclosure practices.',
        difficulty: 'Advanced',
        duration: '10h 00m',
        userCount: 54,
        category: 'Offensive Security',
        color: 'from-slate-600 to-gray-800',
        icon: '⚔️',
        modules: [
            {
                id: '8-1',
                title: 'Pentesting Methodology & Legal Scope',
                description: 'Understand the phases of a penetration test, rules of engagement, and how to stay within legal boundaries.',
                lessons: 3,
                labs: 0,
                hours: '45m',
                difficulty: 'Easy',
                completion: 100,
                status: 'completed',
                image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=60',
                coverImage: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=60',
                estimatedTime: '45m',
                unitCount: 3,
                sections: [{ id: 's8-1-1', title: 'Scope & Rules', collapsed: false, blocks: [{ id: 'b8-1-1', kind: 'text', content: '## Ethics of Hacking\n\nStaying within the legal boundaries of a penetration test.' }] }]
            },
            {
                id: '8-2',
                title: 'Reconnaissance & OSINT',
                description: 'Use passive and active reconnaissance techniques to gather intelligence on targets before exploitation.',
                lessons: 5,
                labs: 2,
                hours: '1h 30m',
                difficulty: 'Medium',
                completion: 100,
                status: 'completed',
                image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&auto=format&fit=crop&q=60',
                coverImage: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&auto=format&fit=crop&q=60',
                estimatedTime: '1h 30m',
                unitCount: 5,
                sections: [{ id: 's8-2-1', title: 'Intelligence Gathering', collapsed: false, blocks: [{ id: 'b8-2-1', kind: 'text', content: '## OSINT Methods\n\nFinding public data about your target.' }] }]
            },
            {
                id: '8-3',
                title: 'Vulnerability Scanning',
                description: 'Run Nessus, OpenVAS, and Nmap scans to enumerate services and identify exploitable vulnerabilities.',
                lessons: 4,
                labs: 2,
                hours: '1h 15m',
                difficulty: 'Medium',
                completion: 40,
                status: 'in-progress',
                image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=60',
                coverImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=60',
                estimatedTime: '1h 15m',
                unitCount: 4,
                sections: [{ id: 's8-3-1', title: 'Automated Scanning', collapsed: false, blocks: [{ id: 'b8-3-1', kind: 'text', content: '## Finding Weak Spots\n\nUsing commercial and open-source scanners.' }] }]
            },
            {
                id: '8-4',
                title: 'Exploitation Fundamentals',
                description: 'Execute controlled exploits using Metasploit, understand payloads, and establish limited post-exploitation footholds.',
                lessons: 6,
                labs: 4,
                hours: '2h 30m',
                difficulty: 'Hard',
                completion: 0,
                status: 'not-started',
                image: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&auto=format&fit=crop&q=60',
                coverImage: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&auto=format&fit=crop&q=60',
                estimatedTime: '2h 30m',
                unitCount: 6,
                sections: [{ id: 's8-4-1', title: 'Metasploit Ops', collapsed: false, blocks: [{ id: 'b8-4-1', kind: 'text', content: '## Real Exploits\n\nExecuting payloads in a controlled lab environment.' }] }]
            },
            {
                id: '8-5',
                title: 'Reporting & Disclosure',
                description: 'Write clear, professional penetration test reports and understand responsible vulnerability disclosure procedures.',
                lessons: 3,
                labs: 1,
                hours: '1h 00m',
                difficulty: 'Medium',
                completion: 0,
                status: 'not-started',
                image: 'https://images.unsplash.com/photo-1454165833744-80e92246f21d?w=800&auto=format&fit=crop&q=60',
                coverImage: 'https://images.unsplash.com/photo-1454165833744-80e92246f21d?w=800&auto=format&fit=crop&q=60',
                estimatedTime: '1h 00m',
                unitCount: 3,
                sections: [{ id: 's8-5-1', title: 'Reporting', collapsed: false, blocks: [{ id: 'b8-5-1', kind: 'text', content: '## Documenting Findings\n\nCommunicating risk to stakeholders.' }] }]
            },
            {
                id: '8-6',
                title: 'Capstone: Full Pentest Simulation',
                description: 'Execute a full simulated penetration test against a vulnerable target environment from recon to report.',
                lessons: 1,
                labs: 5,
                hours: '3h 00m',
                difficulty: 'Hard',
                completion: 0,
                status: 'not-started',
                image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=60',
                coverImage: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=60',
                estimatedTime: '3h 00m',
                unitCount: 1,
                sections: [{ id: 's8-6-1', title: 'Capstone', collapsed: false, blocks: [{ id: 'b8-6-1', kind: 'text', content: '## Final Challenge\n\nPut all your skills to the test in our virtual labs.' }] }]
            },
        ],
    },
]
