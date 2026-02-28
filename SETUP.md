# Setup & Deployment Guide

## Quick Start

### 1. Environment Configuration

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Add your Supabase credentials:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Development Server

```bash
npm run dev
```

The portal will be available at `http://localhost:5173`

### 4. Production Build

```bash
npm run build
```

The optimized build will be in the `dist/` folder.

## Demo Credentials

### Admin Login
- **Email**: `admin@aissms.edu.in`
- **Password**: `admin123`

### Student Login Examples
All demo students use password: `password123`

**Not Placed Students:**
- **PRN**: `PRN2026001` - Rahul Sharma (Approved)
- **PRN**: `PRN2027001` - Arjun Malhotra (Approved)

**Placed Students:**
- **PRN**: `PRN2026002` - Priya Patel (Full-Time Placed - TCS)
- **PRN**: `PRN2026004` - Sneha Gupta (Internship - Wipro)

**Blocked Students:**
- **PRN**: `PRN2026013` - Arun Rao (Blocked - Low CGPA)
- **PRN**: `PRN2027013` - Abhishek Bansal (Blocked - Low CGPA)

**Pending Approval:**
- **PRN**: `PRN2026017` - Sanjay Kulkarni (Pending Admin Approval)
- **PRN**: `PRN2027017` - Mohit Bajaj (Pending Admin Approval)

## Features Overview

### Admin Panel
1. **Dashboard**: Real-time metrics and statistics
2. **Student Management**:
   - View all students with filtering options
   - Approve/reject registration requests
   - Block students with specific reasons
   - Export data to Excel
3. **Company Management**: Add and manage companies
4. **Job Drives**: Create and manage job drives with eligibility criteria

### Student Portal
1. **Job Discovery**: View eligible job opportunities
2. **Applications**: Apply to job drives
3. **Application Tracking**: Monitor application status
4. **Profile Management**: Update academic details

## Database Schema

The application uses Supabase PostgreSQL with the following tables:

- `admin_users` - Admin accounts
- `students` - Student profiles (40 demo students included)
- `companies` - Company information (5 demo companies)
- `job_drives` - Job postings (8 demo drives)
- `applications` - Student applications

All tables have Row Level Security (RLS) enabled for data protection.

## File Storage

Three storage buckets are configured:
- `resumes` - Student resumes (PDF, max 5MB)
- `job-descriptions` - Job description PDFs
- `company-logos` - Company logo images

## Error Handling

The application includes comprehensive error handling:
- Database connection errors
- Validation errors
- Authentication errors
- File upload errors

All errors are displayed with clear, user-friendly messages.

## Deployment Options

### Option 1: Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Option 2: Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

### Option 3: Docker
```bash
docker build -t tpo-portal .
docker run -p 3000:3000 tpo-portal
```

## Troubleshooting

### Login Not Working
1. Check if Supabase URL and key are correct in `.env`
2. Ensure database migrations have run
3. Check browser console for detailed error messages
4. Verify PRN format (should be uppercase, e.g., `PRN2026001`)

### Database Connection Issues
1. Verify Supabase project is active
2. Check internet connection
3. Ensure RLS policies are enabled
4. Review Supabase dashboard for any alerts

### Build Errors
1. Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
2. Clear build cache: `rm -rf dist`
3. Run `npm run build` again

## Performance Tips

- Use pagination for large datasets
- Enable browser caching headers
- Consider CDN for static assets
- Monitor database query performance in Supabase dashboard

## Security Notes

- Passwords are stored as plain text for demo purposes
- In production, use proper password hashing (bcrypt, etc.)
- Enable HTTPS/SSL
- Use environment-specific secrets
- Implement rate limiting on API endpoints
- Regularly review RLS policies

## Support

For technical support or issues, check:
1. Browser developer console for errors
2. Supabase dashboard for database logs
3. Application logs in deployment platform
4. GitHub issues (if applicable)

## License

This project is proprietary software developed for AISSMS Institute of Information Technology.
