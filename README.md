# PesXChange

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

4. **Run the development server:**
   ```sh
   npm run dev
   ```

---

**Note:**
- You must have a Supabase project set up and provide valid keys for authentication and storage to work.
- For Google authentication, ensure you have configured the provider in your Supabase dashboard and set the correct redirect URLs.