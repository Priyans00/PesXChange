# PesXChange

A modern marketplace platform for the PESU community - Live at [pesxchange.app](https://pesxchange.app)

## Installation Guide

1. **Clone the repository:**
   ```sh
   git clone https://github.com/Priyans00/PesXChange
   cd PesXChange
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Set up environment variables:**
   - Copy `.env.example` to a  `.env.local` (create it).
   - Add Supabase project credentials:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
     ```
4. **Setup the SQL database:**
   1. Go to https://app.supabase.com
   2. Open your project
   3. Go to **SQL Editor** → New Query
   4. Paste the contents of `setup.sql`
   5. Click **Run**

5. **Run the development server:**
   ```sh
   npm run dev
   ```

   The application will be available at:
   - **Development**: http://localhost:3000
   - **Production**: https://pesxchange.app

---

**Note:**
- You must have a Supabase project set up and provide valid keys for authentication and storage to work.
- For Google authentication, ensure you have configured the provider in your Supabase dashboard and set the correct redirect URLs:
  - Development: `http://localhost:3000/auth/callback`
  - Production: `https://pesxchange.app/auth/callback`