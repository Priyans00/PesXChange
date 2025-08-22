# PesXChange - PESU Student Marketplace

A secure, feature-rich marketplace exclusively for PESU Academy students to buy, sell, and exchange items within the campus community.

## 🚀 Features

- **PESU Academy Authentication**: Secure login using PESU Academy credentials
- **Real-time Chat**: Direct messaging between buyers and sellers
- **Image Upload**: Base64 image handling for item listings
- **Advanced Filtering**: Search by category, condition, price range
- **User Profiles**: Comprehensive user profiles with stats and listings
- **Mobile Responsive**: Optimized for both desktop and mobile devices
- **Dark/Light Theme**: System-adaptive theming support
- **Error Handling**: Production-ready error boundaries and handling

## 🛠️ Tech Stack

- **Frontend**: Next.js 15.3.5, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Custom PESU Academy integration
- **UI Components**: Radix UI + shadcn/ui
- **Icons**: Lucide React

## 📦 Installation Guide

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### 1. Clone the repository
```sh
git clone https://github.com/Priyans00/PesXChange
cd PesXChange
```

### 2. Install dependencies
```sh
npm install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### 4. Database Setup
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project or open existing one
3. Navigate to **SQL Editor** → **New Query**
4. Copy and paste the contents of `setup.sql`
5. Click **Run** to execute the setup script
6. Run the database fixes from `database-fix-category.sql` to disable RLS policies

### 5. Run the application
```sh
npm run dev
```

The application will be available at `http://localhost:3000`

## 🔧 Configuration

### Database Configuration
The app requires the following Supabase tables:
- `user_profiles` - User information and settings
- `items` - Item listings with images and metadata  
- `categories` - Item categories
- `messages` - Chat messages between users
- `item_likes` - User favorites/likes
- Additional tables for reviews, reports, etc.

### Authentication
The app uses PESU Academy credentials via an external authentication API. Students log in with their SRN and PESU Academy password.

## 📱 Usage

1. **Login**: Use your PESU Academy SRN and password
2. **Browse Items**: View all available items or filter by category/condition
3. **List Items**: Click "Sell" to create a new item listing
4. **Chat**: Click the chat icon on any item to message the seller
5. **Profile**: View your profile, stats, and manage your listings

## 🚀 Production Deployment

### Vercel Deployment (Recommended)
1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Manual Deployment
```sh
npm run build
npm start
```

### Environment Variables for Production
Ensure all environment variables are set in your production environment:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` 
- `SUPABASE_SERVICE_ROLE_KEY`

## 🔍 API Endpoints

- `POST /api/auth/pesu` - PESU Academy authentication
- `GET /api/items` - Fetch all items with filtering
- `POST /api/items` - Create new item listing
- `GET /api/profile/pesu-stats` - Get user profile and stats
- `PUT /api/profile/pesu-update` - Update user profile
- `GET /api/messages` - Fetch chat messages
- `POST /api/messages` - Send new message
- `GET /api/health` - System health check

## 🛡️ Security

- **Row Level Security (RLS)**: Disabled for PESU Auth compatibility
- **Input Validation**: All user inputs are validated
- **Error Boundaries**: Production-ready error handling
- **Authentication**: Secure PESU Academy integration
- **Image Handling**: Safe base64 image processing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- PESU Academy for the authentication system
- Supabase for the backend infrastructure
- shadcn/ui for the component library
- Next.js team for the excellent framework

## 📞 Support

For support, email us at your-email@example.com or create an issue in this repository.

---

**Made with ❤️ for PESU Academy students**