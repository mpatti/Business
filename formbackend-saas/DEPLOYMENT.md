# FormBackend SaaS - Deployment Guide

This guide will help you deploy FormBackend to a production server.

## Quick Deployment Options

### Option 1: Simple VPS Deployment (Recommended for beginners)

**Requirements:**
- A VPS (DigitalOcean, Linode, Vultr, etc.) - $5-10/month
- Ubuntu 22.04 or similar
- Domain name (optional but recommended)

**Steps:**

1. **SSH into your VPS:**
```bash
ssh root@your-server-ip
```

2. **Install Node.js:**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. **Upload your application:**
```bash
# On your local machine
scp -r formbackend-saas root@your-server-ip:/var/www/
```

4. **Install PM2 (process manager):**
```bash
sudo npm install -g pm2
```

5. **Configure environment:**
```bash
cd /var/www/formbackend-saas/backend
cp .env.example .env
nano .env  # Edit with your credentials
```

6. **Start the backend:**
```bash
pm2 start server.js --name formbackend-api
pm2 startup  # Enable auto-restart on reboot
pm2 save
```

7. **Install and configure Nginx:**
```bash
sudo apt-get install nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/formbackend
```

Paste this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/formbackend-saas/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Form submissions endpoint
    location /submit {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/formbackend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

8. **Set up SSL with Let's Encrypt (free):**
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

9. **Done!** Your app is now live at https://your-domain.com

---

### Option 2: Railway.app (Easiest, Free Tier Available)

1. Create account at https://railway.app
2. Create new project from GitHub repo
3. Add environment variables
4. Deploy automatically

**Pros:** Very easy, free tier available
**Cons:** Less control, free tier has limitations

---

### Option 3: DigitalOcean App Platform

1. Create DigitalOcean account
2. Go to App Platform
3. Connect your GitHub repository
4. Configure build settings:
   - Backend: Node.js app at `/backend`
   - Frontend: Static site at `/frontend`
5. Add environment variables
6. Deploy

**Cost:** ~$10-15/month
**Pros:** Managed, automatic scaling
**Cons:** More expensive than VPS

---

## Required Environment Variables

### Backend (.env)

```env
# Server
PORT=3000
NODE_ENV=production
JWT_SECRET=your-random-secret-key-min-32-chars

# Frontend URL (your domain)
FRONTEND_URL=https://your-domain.com

# Email (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password  # Google App Password
SMTP_FROM=FormBackend <your-email@gmail.com>

# Stripe
STRIPE_SECRET_KEY=sk_live_...  # Get from stripe.com
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...  # Create in Stripe Dashboard
STRIPE_BUSINESS_PRICE_ID=price_...
```

---

## Setting Up Stripe

1. Create account at https://stripe.com
2. Get your API keys from Dashboard → Developers → API Keys
3. Create products and prices:
   - Go to Products → Create Product
   - "Pro Plan" - $15/month recurring
   - "Business Plan" - $49/month recurring
   - Copy the Price IDs
4. Set up webhook:
   - Go to Developers → Webhooks
   - Add endpoint: `https://your-domain.com/api/webhook/stripe`
   - Select events: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_failed`
   - Copy webhook secret

---

## Setting Up Email (Gmail)

1. Enable 2-factor authentication on your Google account
2. Go to https://myaccount.google.com/apppasswords
3. Create an app password for "Mail"
4. Use this password in SMTP_PASS (not your regular password)

**Alternative:** Use SendGrid, Mailgun, or AWS SES for better deliverability

---

## Database

The application uses SQLite by default, which is stored in `backend/formbackend.db`.

**For production with higher traffic:**
Consider migrating to PostgreSQL. You'll need to:
1. Install `pg` npm package
2. Update database.js to use PostgreSQL
3. Change connection string in .env

---

## Monitoring

**Check application status:**
```bash
pm2 status
pm2 logs formbackend-api
```

**Monitor server resources:**
```bash
htop  # Install with: sudo apt-get install htop
```

---

## Backups

**Database backup (SQLite):**
```bash
# Backup
cp /var/www/formbackend-saas/backend/formbackend.db /backups/formbackend-$(date +%Y%m%d).db

# Automate with cron
crontab -e
# Add: 0 2 * * * cp /var/www/formbackend-saas/backend/formbackend.db /backups/formbackend-$(date +\%Y\%m\%d).db
```

---

## Monthly Submission Reset

Add a cron job to reset monthly submission counters:

```bash
crontab -e
# Add this line to run on the 1st of each month at midnight:
0 0 1 * * curl http://localhost:3000/api/reset-submissions
```

Then add this endpoint to your backend/server.js:
```javascript
app.post('/api/reset-submissions', (req, res) => {
  db.prepare('UPDATE users SET monthly_submissions = 0').run();
  res.json({ success: true });
});
```

---

## Scaling

**When you start getting traffic:**

1. **Upgrade VPS:** More CPU/RAM
2. **Use PostgreSQL:** Better for concurrent connections
3. **Add Redis:** For rate limiting and caching
4. **Load balancer:** Multiple backend instances
5. **CDN:** Cloudflare for static assets

---

## Security Checklist

- ✅ Use HTTPS (SSL certificate)
- ✅ Strong JWT_SECRET (32+ random characters)
- ✅ Enable firewall (UFW): `sudo ufw enable`
- ✅ Only open ports 22, 80, 443
- ✅ Keep Node.js updated
- ✅ Use environment variables (never commit secrets)
- ✅ Regular backups
- ✅ Monitor logs for suspicious activity

---

## Support

For issues, check:
1. PM2 logs: `pm2 logs`
2. Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Database file exists and is writable
4. Environment variables are set correctly

---

## Cost Estimate

**Monthly costs:**
- VPS (DigitalOcean/Linode): $5-10
- Domain name: $10-15/year (~$1/month)
- Email service (optional): $0-15
- **Total: $6-25/month**

With 67 Pro subscribers at $15/month = $1,005/month revenue
Minus ~$20 costs = **~$985/month profit**

---

## Next Steps

Once deployed:
1. Test all functionality
2. Set up monitoring/alerting
3. Create marketing landing page
4. Start customer acquisition (SEO, ads, content marketing)
5. Join developer communities (Reddit, Discord) to promote

Good luck! 🚀
