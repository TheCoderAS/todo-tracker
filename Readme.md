# Todo Tracker

Firebase-backed todo tracking app built with Next.js.

## Firebase setup

Create a Firebase project, enable **Authentication** (Email/Password + Google), and create a **Cloud Firestore** database.

Copy your web app configuration into environment variables:

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

You can copy `.env.example` to `.env.local` and fill in your values.

## Firestore schema

Todos are stored per-user at:

```
users/{userId}/todos/{todoId}
```

Fields:

- `title` (string)
- `status` ("pending" | "completed")
- `scheduledDate` (Timestamp | null)
- `completedDate` (Timestamp | null)
- `priority` ("low" | "medium" | "high")
- `tags` (string[])
- `createdAt` (server timestamp)
- `updatedAt` (server timestamp)

## Development

```
npm install
npm run dev
```
