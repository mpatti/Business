# FormBackend SaaS

A complete, production-ready SaaS application that provides form handling services for static websites. Built with Node.js, Express, React, and Stripe.

## What is FormBackend?

FormBackend allows developers to add contact forms and other form functionality to static websites (HTML, React, Vue, etc.) without writing backend code. Users sign up, create a form endpoint, and point their HTML forms to it. Submissions are stored and sent via email.

## Revenue Model

- **Free Tier:** 50 submissions/month (free)
- **Pro Tier:** 1,000 submissions/month ($15/month)
- **Business Tier:** Unlimited submissions ($49/month)

**Target:** 67 Pro subscribers = $1,005/month revenue

## Tech Stack

### Backend
- Node.js + Express
- SQLite database (easily upgradeable to PostgreSQL)
- JWT authentication
- Stripe payment integration
- Nodemailer for email notifications
- Rate limiting and security features

### Frontend
- React 18
- React Router for navigation
- Vite for fast development
- Responsive design with CSS

## Quick Start (Development)

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### Installation

1. **Clone and navigate to the directory:**
```bash
cd formbackend-saas
```

2. **Run setup script:**
```bash
chmod +x setup.sh
./setup.sh
```

3. **Configure environment variables:**
Edit `backend/.env` with your credentials:
- JWT_SECRET (generate a random string)
- SMTP credentials (Gmail, SendGrid, etc.)
- Stripe API keys

4. **Start the application:**
```bash
chmod +x start.sh
./start.sh
```

The application will be running at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

### Manual Setup (if scripts don't work)

```bash
# Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
node server.js

# Frontend (in a new terminal)
cd frontend
npm install
npm run dev
```

## Features

### For Users (Your Customers)
- User registration and authentication
- Create unlimited forms (free tier)
- View form submissions in dashboard
- Email notifications for new submissions
- Custom redirect URLs after submission
- API key management
- Subscription management via Stripe
- Usage tracking and limits

### For You (SaaS Owner)
- Automated payment processing via Stripe
- Subscription tier management
- Monthly submission limit enforcement
- Rate limiting to prevent abuse
- Email integration for notifications
- Simple SQLite database (upgrade to PostgreSQL when needed)
- Complete admin dashboard

## Project Structure

```
formbackend-saas/
├── backend/
│   ├── server.js           # Main API server
│   ├── database.js         # Database setup and schema
│   ├── emailService.js     # Email notification handler
│   ├── stripeService.js    # Stripe integration
│   ├── package.json        # Backend dependencies
│   └── .env.example        # Environment variables template
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── App.jsx         # Main app component
│   │   └── main.jsx        # Entry point
│   ├── package.json        # Frontend dependencies
│   └── vite.config.js      # Vite configuration
├── setup.sh                # Automated setup script
├── start.sh                # Development startup script
├── deploy-production.sh    # Production build script
├── DEPLOYMENT.md           # Detailed deployment guide
└── README.md               # This file
```

## API Endpoints

### Public Endpoints
- `POST /submit/:formKey` - Submit a form (public, used by customer websites)

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Forms
- `GET /api/forms` - List all forms
- `POST /api/forms` - Create a new form
- `GET /api/forms/:id` - Get form details
- `PUT /api/forms/:id` - Update form
- `DELETE /api/forms/:id` - Delete form
- `GET /api/forms/:id/submissions` - Get form submissions

### User
- `GET /api/user/profile` - Get user profile
- `POST /api/user/regenerate-key` - Regenerate API key

### Payments
- `POST /api/create-checkout-session` - Create Stripe checkout
- `POST /api/create-portal-session` - Create billing portal
- `POST /api/webhook/stripe` - Stripe webhook handler

### Stats
- `GET /api/stats` - Get user statistics

## Configuration

### Email Setup (Gmail Example)

1. Enable 2-factor authentication on Google account
2. Generate app password: https://myaccount.google.com/apppasswords
3. Add to `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Stripe Setup

1. Create Stripe account: https://stripe.com
2. Get API keys from Dashboard → Developers → API Keys
3. Create products:
   - Pro Plan: $15/month recurring
   - Business Plan: $49/month recurring
4. Set up webhook endpoint: `https://yourdomain.com/api/webhook/stripe`
5. Add credentials to `.env`

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

**Quick deployment options:**
1. VPS (DigitalOcean, Linode) - $5-10/month
2. Railway.app - Free tier available
3. DigitalOcean App Platform - ~$10-15/month

## Customer Acquisition Strategy

Once deployed, you need to get customers. Here's how:

### 1. SEO & Content Marketing
- Write blog posts: "How to add forms to static sites"
- Create comparison pages: "FormBackend vs FormSpree"
- Developer tutorials on Dev.to, Medium

### 2. Community Engagement
- Answer questions on Stack Overflow
- Participate in r/webdev, r/javascript
- Join Discord servers for web developers

### 3. Free Tier Marketing
- Generous free tier attracts users
- Some will upgrade as they grow

### 4. Partnerships
- Reach out to static site hosting companies (Netlify, Vercel)
- Create integration guides

### 5. Paid Advertising
- Google Ads for "static site form backend"
- Reddit ads in developer subreddits

## Maintenance

### Monthly Tasks
- Monitor server resources
- Check error logs
- Review customer feedback
- Update dependencies (security patches)

### Automated Tasks (Set up cron jobs)
- Reset monthly submission counters (1st of each month)
- Database backups (daily)
- Monitor uptime (use UptimeRobot.com - free)

## Scaling Roadmap

**When you hit 100+ users:**
1. Migrate to PostgreSQL
2. Add Redis for caching
3. Implement webhook forwarding feature
4. Add more integrations (Zapier, Slack, etc.)

**When you hit 1,000+ users:**
1. Multiple server instances
2. Load balancer
3. CDN for static assets
4. Dedicated support staff

## Security

- HTTPS required in production
- JWT tokens for authentication
- Rate limiting on all endpoints
- SQL injection protection via parameterized queries
- Input validation on all endpoints
- Environment variables for secrets

## Testing Your App

### Test Locally

1. Create an account
2. Create a form
3. Test form submission with this HTML:

```html
<!DOCTYPE html>
<html>
<body>
  <form action="http://localhost:3000/submit/YOUR_FORM_KEY" method="POST">
    <input type="text" name="name" placeholder="Name" required>
    <input type="email" name="email" placeholder="Email" required>
    <textarea name="message" placeholder="Message"></textarea>
    <button type="submit">Submit</button>
  </form>
</body>
</html>
```

4. Check dashboard for submission
5. Test payment flow (use Stripe test mode)

## Troubleshooting

### Backend won't start
- Check `.env` file exists and has required variables
- Ensure port 3000 is not in use
- Check `npm install` completed successfully

### Frontend won't start
- Ensure port 5173 is not in use
- Check `npm install` in frontend folder
- Verify Vite config is correct

### Forms not submitting
- Check CORS settings
- Verify form key is correct
- Check rate limits haven't been exceeded
- View browser console for errors

### Emails not sending
- Verify SMTP credentials in `.env`
- Check email provider allows SMTP
- Gmail requires app password (not regular password)
- Check spam folder

## License

MIT License - Feel free to modify and use for your business

## Support

This is a complete, working application. However, you're responsible for:
- Deploying and maintaining the server
- Customer support
- Marketing and customer acquisition
- Monitoring and updates

## Realistic Expectations

**Time to first customer:** 2-4 weeks (with active marketing)
**Time to $1000/month:** 3-6 months (with consistent effort)

**Required ongoing work:**
- Customer support: 1-2 hours/week initially
- Marketing: 5-10 hours/week
- Maintenance: 1-2 hours/week
- Monitoring: 15 minutes/day

**This is not passive income**, but it's significantly more automated than most businesses.

## Next Steps

1. ✅ Complete setup locally
2. ✅ Test all features
3. ⬜ Deploy to production server
4. ⬜ Set up Stripe products and webhook
5. ⬜ Configure email service
6. ⬜ Create marketing landing page
7. ⬜ Start customer acquisition
8. ⬜ Monitor and iterate based on feedback

Good luck with your SaaS! 🚀
