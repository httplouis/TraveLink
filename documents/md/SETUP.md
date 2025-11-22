# TraviLink Setup Guide

## Prerequisites
- Node.js 18+ and npm/pnpm
- Git
- Supabase account and project

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd TraviLink
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory with the following:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   RESEND_API_KEY=your_resend_api_key (optional, for email)
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Common Issues

### "router is not defined" error
- Make sure all navigation components have `useRouter` imported and initialized
- Run `npm install` or `pnpm install` to ensure all dependencies are installed

### Slow loading times
- The app uses caching for better performance
- First load may be slower, subsequent loads will be faster
- Check your Supabase connection and network speed

### Environment variables not working
- Make sure `.env.local` is in the root directory (not in `src/`)
- Restart the dev server after adding/changing environment variables
- Never commit `.env.local` to git (it's in `.gitignore`)

### Database connection issues
- Verify your Supabase URL and keys are correct
- Check if your Supabase project is active
- Ensure your database tables are set up correctly

## Development Tips

- Use `npm run build` to test production build locally
- Use `npm run lint` to check for code issues
- The app uses Next.js 14+ with App Router
- All API routes are in `src/app/api/`
- Components are in `src/components/`

## Need Help?

Check the main README.md for more detailed information.

