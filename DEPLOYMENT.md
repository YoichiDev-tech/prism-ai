# Ultron Deployment Guide

## Option 1: Vercel (Recommended - Easiest & Free)

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ultron-ai.git
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Go to https://vercel.com and sign up (free)
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js
5. **Important**: Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL` (your Supabase project URL)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (your Supabase anon key)
   - `GROQ_API_KEY` (your Groq API key)
   - `GROQ_MODEL` (e.g., `llama-3.3-70b-versatile`)

6. Click "Deploy"

7. Your app will be live at `https://your-project.vercel.app`

### Step 3: Set Up Supabase for Production

1. In Supabase dashboard, enable "Confirm email" (it was disabled for local testing)
2. Update your site URL in Supabase auth settings to your Vercel URL
3. Consider adding rate limiting on auth endpoints

### Step 4: Custom Domain (Optional)

1. In Vercel project settings, add your custom domain
2. Update DNS records as instructed by Vercel
3. Update Supabase auth settings with your custom domain

## Option 2: Self-Hosted VPS

### Prerequisites

- A VPS (DigitalOcean, Linode, Hetzner, etc.)
- Domain name (optional)
- Basic Linux knowledge

### Setup Steps

```bash
# SSH into your VPS
ssh user@your-vps-ip

# Install Node.js (using NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone your repository
git clone https://github.com/YOUR_USERNAME/prism-ai.git
cd prism-ai

# Install dependencies
npm install

# Build the application
npm run build

# Install PM2 for process management
sudo npm install -g pm2

# Set up environment variables
nano .env.local
# Add your Supabase and Groq credentials

# Start with PM2
pm2 start npm --name "ultron-ai" -- start
pm2 save
pm2 startup
```

### Set Up Nginx (Reverse Proxy)

```bash
sudo apt install nginx

sudo nano /etc/nginx/sites-available/ultron-ai
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/ultron-ai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Option 3: Docker Deployment

### Create Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### Create docker-compose.yml

```yaml
version: '3.8'

services:
  prism-ai:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - GROQ_API_KEY=${GROQ_API_KEY}
      - GROQ_MODEL=${GROQ_MODEL}
    restart: unless-stopped
```

### Deploy

```bash
docker-compose up -d
```

## Environment Variables Checklist

For all deployment methods, ensure these are set:

**Required:**
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon public key
- `GROQ_API_KEY` - Your Groq API key
- `GROQ_MODEL` - Model to use (default: `llama-3.3-70b-versatile`)

**Optional:**
- `NODE_ENV` - Set to `production` for production builds

## Post-Deployment Checklist

- [ ] Test authentication flow
- [ ] Verify AI responses work
- [ ] Check mobile responsiveness
- [ ] Test with different browsers
- [ ] Enable email confirmation in Supabase (production)
- [ ] Set up monitoring/error tracking (optional)
- [ ] Configure backup strategy for Supabase
- [ ] Review rate limits and usage

## Monitoring & Maintenance

### Vercel
- Built-in analytics
- Automatic deployments from git
- Log viewing in dashboard
- Uptime monitoring

### Self-Hosted
- Use PM2 logs: `pm2 logs prism-ai`
- Set up log rotation
- Monitor server resources
- Regular updates: `npm run build && pm2 restart prism-ai`

### Backups
- Supabase: Enable automated backups in dashboard
- Code: Git repository is your backup
- Environment variables: Store securely (not in git)

## Scaling Considerations

### When to Upgrade

**Supabase Free Tier Limits:**
- 500 MB database
- 1 GB file storage
- 2GB bandwidth/month
- 50,000 monthly active users

**Groq Free Tier Limits:**
- Rate limits on requests/minute
- Daily token limits
- Check current limits at console.groq.com

**Signs you need to upgrade:**
- Frequent rate limit errors
- Slow performance
- Near storage limits
- Need more concurrent users

### Upgrade Path

1. **Supabase Pro Tier** (~$25/month)
   - 8GB database
   - 100GB storage
   - Higher bandwidth
   - Priority support

2. **Groq Paid Tier**
   - Higher rate limits
   - More tokens
   - Priority processing

3. **Infrastructure**
   - Larger VPS or dedicated server
   - Load balancing
   - CDN integration

## Security Best Practices

1. **Never commit `.env.local`** to git
2. **Rotate API keys** periodically
3. **Enable email confirmation** in production
4. **Use HTTPS** everywhere
5. **Monitor for unusual activity**
6. **Keep dependencies updated**: `npm audit fix`
7. **Review Supabase RLS policies** regularly
8. **Set up authentication rate limiting**

## Cost Summary

**Free Tier (Current Setup):**
- Vercel Hobby: $0/month
- Supabase Free: $0/month
- Groq Free: $0/month
- **Total: $0/month**

**Estimated Paid Tier (if needed):**
- Vercel Pro: $20/month (optional)
- Supabase Pro: $25/month
- Groq Paid: Variable (usage-based)
- **Total: ~$45-100/month depending on usage**

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Groq Docs**: https://console.groq.com/docs
- **Next.js Docs**: https://nextjs.org/docs

## Troubleshooting Deployment Issues

**Build fails on Vercel:**
- Check build logs in Vercel dashboard
- Ensure all dependencies are in package.json
- Verify environment variables are set

**Auth not working:**
- Check Supabase auth settings
- Verify site URL is correct
- Check email confirmation settings

**AI not responding:**
- Verify Groq API key is valid
- Check Groq service status
- Review rate limits

**Database errors:**
- Ensure schema.sql was run
- Check RLS policies
- Verify connection string
