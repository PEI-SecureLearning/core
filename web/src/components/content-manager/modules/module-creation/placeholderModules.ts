import type { ModuleFormData } from './types'

export interface PlaceholderModule extends Omit<ModuleFormData, 'coverImageId' | 'hasRefreshModule' | 'refreshSections'> {
    id: string
    image: string
    unitCount: number
    coverImageId?: string
    hasRefreshModule?: boolean
    refreshSections?: ModuleFormData['refreshSections']
}

export const PLACEHOLDER_MODULES: PlaceholderModule[] = [
    {
        id: 'mod-1',
        title: 'Introduction to Python',
        category: 'Programming',
        description: 'Learn the basics of Python programming from scratch. Covers variables, control flow, functions, and standard library essentials.',
        coverImage: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&auto=format&fit=crop&q=60',
        image: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&auto=format&fit=crop&q=60',
        estimatedTime: '2h 30m',
        difficulty: 'Easy',
        unitCount: 6,
        sections: [
            {
                id: 's1-1', title: 'Setting Up Your Environment', collapsed: false,
                blocks: [
                    { id: 'b1', kind: 'text', content: '## Why Python?\n\nPython is one of the most popular programming languages in the world. It is used in web development, data science, automation, and more.\n\n**Key advantages:**\n- Simple, readable syntax\n- Huge standard library\n- Great for beginners and experts alike' },
                    { id: 'b2', kind: 'rich_content', mediaType: 'image', url: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&auto=format&fit=crop&q=60', contentId: '', caption: 'Python development environment' },
                    { id: 'b3', kind: 'question', question: { id: 'q1', type: 'multiple_choice', text: 'Which of the following best describes Python?', choices: [{ id: 'c1', text: 'A compiled, statically typed language', isCorrect: false }, { id: 'c2', text: 'An interpreted, dynamically typed language', isCorrect: true }, { id: 'c3', text: 'A markup language for the web', isCorrect: false }], answer: 'c2' } },
                ],
            },
            {
                id: 's1-2', title: 'Variables & Data Types', collapsed: false,
                blocks: [
                    { id: 'b4', kind: 'text', content: '## Variables in Python\n\nIn Python you don\'t need to declare variable types — the interpreter infers them.\n\n```python\nname = "Alice"\nage = 30\nheight = 1.72\nis_active = True\n```\n\nCommon built-in types include `str`, `int`, `float`, `bool`, `list`, `dict`, and `tuple`.' },
                    { id: 'b5', kind: 'question', question: { id: 'q2', type: 'true_false', text: 'In Python, you must declare the type of a variable before using it.', choices: [{ id: 'tf-t', text: 'True', isCorrect: false }, { id: 'tf-f', text: 'False', isCorrect: true }], answer: 'tf-f' } },
                ],
            },
            {
                id: 's1-3', title: 'Control Flow', collapsed: false,
                blocks: [
                    { id: 'b6', kind: 'text', content: '## If / Elif / Else\n\nPython uses indentation to define code blocks.\n\n```python\nscore = 85\n\nif score >= 90:\n    print("A")\nelif score >= 75:\n    print("B")\nelse:\n    print("C")\n```' },
                    { id: 'b7', kind: 'question', question: { id: 'q3', type: 'multiple_choice', text: 'What determines a code block in Python?', choices: [{ id: 'c4', text: 'Curly braces {}', isCorrect: false }, { id: 'c5', text: 'Indentation', isCorrect: true }, { id: 'c6', text: 'Keywords like BEGIN/END', isCorrect: false }], answer: 'c5' } },
                ],
            },
        ],
    },
    {
        id: 'mod-2',
        title: 'RESTful API Design',
        category: 'Backend',
        description: 'Design robust and scalable REST APIs with best practices. Covers HTTP methods, status codes, authentication, and versioning.',
        coverImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=60',
        image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=60',
        estimatedTime: '3h',
        difficulty: 'Medium',
        unitCount: 8,
        sections: [
            {
                id: 's2-1', title: 'HTTP Fundamentals', collapsed: false,
                blocks: [
                    { id: 'b8', kind: 'text', content: '## HTTP Methods\n\nREST APIs use HTTP verbs to define the action being performed on a resource:\n\n| Method | Action |\n| --- | --- |\n| GET | Read a resource |\n| POST | Create a resource |\n| PUT | Replace a resource |\n| PATCH | Partially update |\n| DELETE | Remove a resource |' },
                    { id: 'b9', kind: 'question', question: { id: 'q4', type: 'multiple_choice', text: 'Which HTTP method should be used to partially update a resource?', choices: [{ id: 'c7', text: 'PUT', isCorrect: false }, { id: 'c8', text: 'POST', isCorrect: false }, { id: 'c9', text: 'PATCH', isCorrect: true }], answer: 'c9' } },
                ],
            },
            {
                id: 's2-2', title: 'Status Codes & Error Handling', collapsed: false,
                blocks: [
                    { id: 'b10', kind: 'text', content: '## Common Status Codes\n\n- **200 OK** — Request succeeded\n- **201 Created** — Resource was created\n- **400 Bad Request** — Invalid input from client\n- **401 Unauthorized** — Authentication required\n- **403 Forbidden** — Access denied\n- **404 Not Found** — Resource does not exist\n- **500 Internal Server Error** — Server failure\n\nAlways return meaningful error messages in the body.' },
                    { id: 'b11', kind: 'question', question: { id: 'q5', type: 'true_false', text: 'A 401 response means the user is authenticated but lacks permission.', choices: [{ id: 'tf-t', text: 'True', isCorrect: false }, { id: 'tf-f', text: 'False', isCorrect: true }], answer: 'tf-f' } },
                ],
            },
        ],
    },
    {
        id: 'mod-3',
        title: 'Database Modeling',
        category: 'Data',
        description: 'Master relational database design and normalization techniques. Learn ER diagrams, normal forms, and how to write efficient queries.',
        coverImage: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&auto=format&fit=crop&q=60',
        image: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&auto=format&fit=crop&q=60',
        estimatedTime: '2h 45m',
        difficulty: 'Medium',
        unitCount: 7,
        sections: [
            {
                id: 's3-1', title: 'Entity-Relationship Diagrams', collapsed: false,
                blocks: [
                    { id: 'b12', kind: 'text', content: '## What is an ER Diagram?\n\nAn **Entity-Relationship (ER) diagram** is a visual representation of the data and the relationships between entities in a system.\n\n**Key components:**\n- **Entities** — Tables (e.g., `User`, `Order`)\n- **Attributes** — Columns (e.g., `email`, `created_at`)\n- **Relationships** — Foreign keys and join tables' },
                    { id: 'b13', kind: 'question', question: { id: 'q6', type: 'multiple_choice', text: 'In a one-to-many relationship, where is the foreign key placed?', choices: [{ id: 'c10', text: 'On the "one" side', isCorrect: false }, { id: 'c11', text: 'On the "many" side', isCorrect: true }, { id: 'c12', text: 'In a separate junction table', isCorrect: false }], answer: 'c11' } },
                ],
            },
            {
                id: 's3-2', title: 'Normalization', collapsed: false,
                blocks: [
                    { id: 'b14', kind: 'text', content: '## Normal Forms\n\nNormalization reduces data redundancy and improves integrity:\n\n- **1NF** — Atomic columns, no repeating groups\n- **2NF** — 1NF + no partial dependencies on composite key\n- **3NF** — 2NF + no transitive dependencies\n\n> Most production schemas target 3NF as a practical balance.' },
                    { id: 'b15', kind: 'question', question: { id: 'q7', type: 'true_false', text: 'Normalization always improves query read performance.', choices: [{ id: 'tf-t', text: 'True', isCorrect: false }, { id: 'tf-f', text: 'False', isCorrect: true }], answer: 'tf-f' } },
                ],
            },
        ],
    },
    {
        id: 'mod-4',
        title: 'Authentication & Security',
        category: 'Security',
        description: 'Implement secure authentication flows and authorization patterns. Covers JWT, OAuth 2.0, RBAC, and common vulnerabilities.',
        coverImage: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800&auto=format&fit=crop&q=60',
        image: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800&auto=format&fit=crop&q=60',
        estimatedTime: '3h 15m',
        difficulty: 'Hard',
        unitCount: 9,
        sections: [
            {
                id: 's4-1', title: 'JWT Tokens', collapsed: false,
                blocks: [
                    { id: 'b16', kind: 'text', content: '## JSON Web Tokens\n\nA **JWT** is a compact, URL-safe token used to securely transmit information. It has three parts:\n\n```\nheader.payload.signature\n```\n\n- **Header** — Algorithm & token type\n- **Payload** — Claims (user id, roles, expiry)\n- **Signature** — Verifies the token was not tampered with\n\n⚠️ Never store sensitive data in the payload — it is Base64 encoded, not encrypted.' },
                    { id: 'b17', kind: 'question', question: { id: 'q8', type: 'multiple_choice', text: 'Which part of a JWT prevents tampering?', choices: [{ id: 'c13', text: 'The header', isCorrect: false }, { id: 'c14', text: 'The payload', isCorrect: false }, { id: 'c15', text: 'The signature', isCorrect: true }], answer: 'c15' } },
                ],
            },
            {
                id: 's4-2', title: 'OAuth 2.0 Flows', collapsed: false,
                blocks: [
                    { id: 'b18', kind: 'text', content: '## Authorization Code Flow\n\nThe most secure OAuth 2.0 flow for server-side apps:\n\n1. User clicks "Login with Provider"\n2. App redirects to Authorization Server\n3. User authenticates and consents\n4. Authorization Server redirects back with an **authorization code**\n5. App exchanges code for an **access token** (server-to-server)\n\nThe code is short-lived and single-use.' },
                    { id: 'b19', kind: 'question', question: { id: 'q9', type: 'true_false', text: 'In the Authorization Code flow, the access token is passed directly in the browser redirect.', choices: [{ id: 'tf-t', text: 'True', isCorrect: false }, { id: 'tf-f', text: 'False', isCorrect: true }], answer: 'tf-f' } },
                ],
            },
        ],
    },
    {
        id: 'mod-5',
        title: 'State Management',
        category: 'Frontend',
        description: 'Explore modern state management solutions for complex UIs. Covers local state, context, Zustand, and server state with React Query.',
        coverImage: 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=800&auto=format&fit=crop&q=60',
        image: 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=800&auto=format&fit=crop&q=60',
        estimatedTime: '2h',
        difficulty: 'Medium',
        unitCount: 5,
        sections: [
            {
                id: 's5-1', title: 'Local vs Global State', collapsed: false,
                blocks: [
                    { id: 'b20', kind: 'text', content: '## Choosing Where to Put State\n\n| State Type | When to Use | Solution |\n| --- | --- | --- |\n| Local UI state | Component-only | `useState` |\n| Shared UI state | A few components | Lifting state / Context |\n| Server state | Data from API | React Query / SWR |\n| Global app state | Complex cross-cutting | Zustand / Redux |\n\nStart simple — only reach for global state when you feel the pain.' },
                    { id: 'b21', kind: 'question', question: { id: 'q10', type: 'multiple_choice', text: 'Which tool is specifically designed for managing server/async state in React?', choices: [{ id: 'c16', text: 'Zustand', isCorrect: false }, { id: 'c17', text: 'React Query', isCorrect: true }, { id: 'c18', text: 'useState', isCorrect: false }], answer: 'c17' } },
                ],
            },
        ],
    },
    {
        id: 'mod-6',
        title: 'Cloud Deployment',
        category: 'DevOps',
        description: 'Deploy and manage applications on cloud infrastructure. Covers containers, CI/CD pipelines, and infrastructure as code.',
        coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=60',
        image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=60',
        estimatedTime: '4h',
        difficulty: 'Hard',
        unitCount: 10,
        sections: [
            {
                id: 's6-1', title: 'Containers with Docker', collapsed: false,
                blocks: [
                    { id: 'b22', kind: 'text', content: '## What is a Container?\n\nA container packages your application and all its dependencies into a single, portable unit that runs consistently across environments.\n\n**vs Virtual Machines:**\n- Containers share the host OS kernel — much lighter\n- Start in milliseconds instead of minutes\n- Great for microservices\n\n```dockerfile\nFROM node:20-alpine\nWORKDIR /app\nCOPY . .\nRUN npm ci\nCMD ["node", "server.js"]\n```' },
                    { id: 'b23', kind: 'question', question: { id: 'q11', type: 'multiple_choice', text: 'What is the main advantage of containers over VMs?', choices: [{ id: 'c19', text: 'Containers have their own OS kernel', isCorrect: false }, { id: 'c20', text: 'Containers are lighter and start faster by sharing the host kernel', isCorrect: true }, { id: 'c21', text: 'Containers provide stronger security isolation', isCorrect: false }], answer: 'c20' } },
                ],
            },
            {
                id: 's6-2', title: 'CI/CD Pipelines', collapsed: false,
                blocks: [
                    { id: 'b24', kind: 'text', content: '## Continuous Integration / Continuous Delivery\n\nA CI/CD pipeline automates the steps from code commit to production:\n\n1. **CI** — Run tests on every push (lint, unit, integration)\n2. **CD** — Build and push a Docker image\n3. **Deploy** — Update the running service with the new image\n\nPopular tools: **GitHub Actions**, **GitLab CI**, **Jenkins**' },
                    { id: 'b25', kind: 'question', question: { id: 'q12', type: 'true_false', text: 'Continuous Delivery means every commit is automatically deployed to production without human approval.', choices: [{ id: 'tf-t', text: 'True', isCorrect: false }, { id: 'tf-f', text: 'False', isCorrect: true }], answer: 'tf-f' } },
                ],
            },
        ],
    },
]
