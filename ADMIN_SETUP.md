# Admin & S3 Setup Guide

## AWS S3 Configuration for Review Images

### 1. Create an S3 Bucket

1. Go to [AWS S3 Console](https://s3.console.aws.amazon.com/)
2. Create a new bucket (e.g., `badscandi-reviews`)
3. Configure bucket settings:
   - **Block Public Access**: Disable (we need public-read access for images)
   - **Bucket Policy**: Add the following policy to allow public read access:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::badscandi-reviews/*"
    }
  ]
}
```

### 2. Create IAM User for S3 Access

1. Go to [IAM Console](https://console.aws.amazon.com/iam/)
2. Create a new user with programmatic access
3. Attach the following policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::badscandi-reviews/*"
    }
  ]
}
```

4. Save the Access Key ID and Secret Access Key

### 3. Add Environment Variables

Add these to your `.env` file:

```bash
# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_S3_BUCKET_NAME=badscandi-reviews
```

## Admin User Setup

### Making a User an Admin

After a user signs up/logs in to the site, you need to manually set them as an admin in the database:

#### Option 1: Using Prisma Studio (Development)

```bash
npx prisma studio
```

1. Navigate to the `User` table
2. Find the user's record by email
3. Set `isAdmin` to `true`
4. Save the changes

#### Option 2: Using Database Query (Production)

Connect to your database and run:

```sql
UPDATE "User"
SET "isAdmin" = true
WHERE email = 'your-email@example.com';
```

#### Option 3: Using Prisma Client

Create a script `scripts/make-admin.ts`:

```typescript
import { prisma } from "../lib/prisma";

async function makeAdmin(email: string) {
  const user = await prisma.user.update({
    where: { email },
    data: { isAdmin: true },
  });

  console.log(`User ${user.email} is now an admin`);
}

// Usage
makeAdmin("your-email@example.com")
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

Run it with:
```bash
npx tsx scripts/make-admin.ts
```

## Accessing Admin Panel

Once you're set as an admin:

1. Sign in to the site
2. Navigate to `/admin/reviews`
3. You'll see the review management interface

Features:
- View pending, approved, and all reviews
- Approve or reject customer-submitted reviews
- Feature reviews to appear on the homepage
- Delete inappropriate reviews

## Security Notes

- Only trusted users should be given admin access
- The admin panel checks authentication on every page load
- Non-admin users are redirected to the homepage if they try to access admin routes
- Review submissions require admin approval before appearing on the site

## Testing

1. **Test Review Submission**: Visit `/submit-review` and submit a test review with photos
2. **Test S3 Upload**: Check your S3 bucket for the uploaded images
3. **Test Admin Panel**: Log in as admin and visit `/admin/reviews`
4. **Test Approval Flow**: Approve a review and verify it appears on the homepage (if featured)
