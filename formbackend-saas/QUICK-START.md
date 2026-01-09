# Quick Start Guide

## Get Started in 5 Minutes

### 1. Install Dependencies

```bash
cd formbackend-saas
./setup.sh
```

### 2. Configure Environment

Edit `backend/.env` with your credentials:

```bash
nano backend/.env
```

**Minimum required changes:**
- `JWT_SECRET` - Change to a random string (at least 32 characters)
- `SMTP_USER` and `SMTP_PASS` - Your email credentials

**For testing only:** You can skip Stripe configuration initially.

### 3. Start the Application

```bash
./start.sh
```

Open http://localhost:5173 in your browser.

### 4. Create Your First Account

1. Click "Sign Up"
2. Enter email and password
3. You're in! Create a form and test it.

### 5. Test Form Submission

Create a test HTML file:

```html
<!DOCTYPE html>
<html>
<body>
  <form action="http://localhost:3000/submit/YOUR_FORM_KEY" method="POST">
    <input type="text" name="name" placeholder="Name" required>
    <input type="email" name="email" placeholder="Email" required>
    <button type="submit">Submit</button>
  </form>
</body>
</html>
```

Replace `YOUR_FORM_KEY` with the key from your dashboard.

## What's Next?

Once you've tested locally:

1. **Set up Stripe** (see README.md)
2. **Deploy to production** (see DEPLOYMENT.md)
3. **Start marketing** to get customers

## Need Help?

Check:
- README.md - Full documentation
- DEPLOYMENT.md - Production deployment guide
- Backend logs if something doesn't work

## Common Issues

**Port already in use?**
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or change PORT in backend/.env
```

**Can't send emails?**
- Gmail requires "App Password" (not regular password)
- Or skip email config for testing (submissions still work)

That's it! You have a working SaaS application. Now deploy and start getting customers.
