# Alpha Insights: Stock Portfolio Tracker — Product Requirements Document (PRD)

## 1. Project Overview & Goals

Alpha Insights is a modern, AI-powered stock portfolio tracker designed for retail investors and finance students. The goal is to deliver a functional MVP in one day, featuring a sophisticated dark-themed UI inspired by the provided HTML/CSS sample. The application will offer real-time market data, portfolio management, AI-driven insights, and a multi-agent chatbot system, with robust admin controls.

**Target Audience:**
- Retail investors seeking actionable insights and portfolio management tools
- Finance students interested in learning and tracking investments

**Primary Goal:**
- Rapid development of a visually stunning, feature-rich MVP with seamless user and admin experiences

---

## 2. Core Features & Functionality

### MVP Features
- User/Admin Authentication (email/password, password reset)
- Landing Page with animated 3D background
- User Dashboard: Portfolio overview, key stats, charts
- Portfolio Management: Manual stock entry, equity support
- AI Chat (multi-agent system)
- Real-time Market Data (Polygon.io primary, Finnhub backup)
- Stock Research Page
- Notifications Center (real-time price alerts)
- Education Hub (text guides)
- User Profile & Settings

### Secondary Features
- Admin Panel (Dashboard, User Management, System & Settings)
- Advanced analytics for admins
- System health indicators

---

## 3. Admin Authentication & Access Control

- Role-based system: Users and admins distinguished by 'role' field in MongoDB user model
- No public admin signup; admin accounts created securely via backend
- Single login page for all; JWT includes role info
- Frontend AuthContext uses JWT to grant access to protected admin routes

---

## 4. Detailed Page-by-Page Breakdown

### User-Facing Pages

#### Landing Page
- **Objective:** Welcome users and showcase Alpha Insights’ value proposition
- **Layout:** Full-screen hero section, animated 3D background, headline, CTA buttons, feature highlights
- **Key Features:**
  - Animated Spline-style background
  - Gradient headline and subheading
  - CTA buttons (Sign Up, Learn More)
  - Feature cards (glassmorphic)
- **UI/UX Design:** Deep slate background (bg-slate-900), glassmorphic cards, vibrant indigo-purple gradients, Inter font, floating/animated elements, responsive design

#### Login & Signup Pages
- **Objective:** Secure user authentication and onboarding
- **Layout:** Centered glassmorphic card, input fields, CTA buttons
- **Key Features:**
  - Email/password signup and login
  - Password reset option
  - Error/success messages
- **UI/UX Design:** Frosted glass effect, semi-transparent backgrounds, accent indigo buttons, clear input fields, Inter font, smooth transitions

#### User Dashboard (Main View)
- **Objective:** Provide users with a real-time overview of their portfolio and key stats
- **Layout:** Sidebar navigation, main content area with stats, charts, and recent activity
- **Key Features:**
  - Portfolio summary (total value, gain/loss)
  - Interactive charts (Recharts)
  - Recent transactions
  - Quick links to research, trading, notifications
- **UI/UX Design:** Glassmorphic containers, animated chart highlights, gradient accents, floating effect for stats, deep dark background

#### Stock Research Page
- **Objective:** Enable users to research stocks and view detailed analytics
- **Layout:** Search bar, results table, stock detail modal
- **Key Features:**
  - Stock search (Polygon.io/Finnhub)
  - Key metrics and charts
  - Add to portfolio button
- **UI/UX Design:** Glassmorphic cards, gradient highlights for key stats, interactive transitions, Inter font

#### Virtual Trading / Portfolio Page
- **Objective:** Allow users to manage and simulate their stock portfolio
- **Layout:** Portfolio table, add/edit/delete stock modal, summary stats
- **Key Features:**
  - Manual stock entry (equities only)
  - Edit/delete holdings
  - Portfolio performance chart
- **UI/UX Design:** Frosted glass modals, semi-transparent tables, accent buttons, smooth hover effects

#### User Profile & Settings Page
- **Objective:** Manage personal details, password, and theme preferences
- **Layout:** Profile card, settings form, theme toggle
- **Key Features:**
  - Edit personal info
  - Change password
  - Toggle dark/light theme
- **UI/UX Design:** Glassmorphic profile card, clear input fields, accent buttons, Inter font

#### Notifications Center Page
- **Objective:** Display historical log of all alerts (price, news, etc.)
- **Layout:** List/table of notifications, filter/search options
- **Key Features:**
  - Real-time price alerts (WebSocket)
  - Notification history
  - Mark as read/delete
- **UI/UX Design:** Glassmorphic notification cards, deep slate background, gradient highlights for unread alerts

#### Education Hub Page
- **Objective:** Provide educational articles and guides powered by the Education Agent
- **Layout:** Article list, search/filter, article detail view
- **Key Features:**
  - Text guides (no video for MVP)
  - Search and filter articles
  - Bookmark/save for later (optional)
- **UI/UX Design:** Glassmorphic article cards, gradient headlines, Inter font, responsive layout

#### AI Chat Interface (Floating Widget)
- **Objective:** Enable users to interact with multi-agent AI system for insights and support
- **Layout:** Floating chat widget accessible from all main pages
- **Key Features:**
  - Query routing via Master Agent
  - Access to portfolio, research, support, suggestions, navigation, alerts, education agents
  - Context-aware responses
- **UI/UX Design:** Glassmorphic chat modal, animated transitions, accent send button, Inter font

### Admin Pages

#### Admin Dashboard (Overview)
- **Objective:** Provide high-level analytics and system health status for admins
- **Layout:** Summary cards, system health indicators, charts
- **Key Features:**
  - Total users, active sessions
  - API, DB, Cache status
  - Quick actions
- **UI/UX Design:** Glassmorphic summary cards, gradient highlights, status badges, deep dark background

#### Admin User Management
- **Objective:** View, search, and filter all registered users
- **Layout:** Table of users, search/filter bar
- **Key Features:**
  - View user details
  - Search/filter users
  - Edit user details (optional)
- **UI/UX Design:** Glassmorphic table, accent buttons, clear input fields, Inter font

#### Admin System & Settings Page
- **Objective:** Manage system-level settings and monitor API key usage
- **Layout:** Settings form, API key usage stats, action buttons
- **Key Features:**
  - View API key usage
  - Manage system settings
  - Clear Redis cache button
- **UI/UX Design:** Glassmorphic settings card, accent action buttons, status indicators

---

## 5. Component Design System (Simplified)

- **GlassmorphicCard:** Frosted glass effect, semi-transparent bg, border-slate-700/50, backdrop-blur
- **GradientButton:** Vibrant indigo-purple gradient, rounded corners, hover transitions
- **Input Fields:** Clear, high-contrast, Inter font, focus ring
- **Charts:** Recharts, animated highlights, gradient accents
- **Modals:** Glassmorphic, smooth open/close transitions
- **Tables:** Semi-transparent, accent borders, responsive
- **Floating Widget:** Glassmorphic, animated, accessible from all main pages

---

## 6. Design Considerations

- Consistent dark mode (bg-slate-900, text-gray-300/white)
- Inter font family, varied weights for hierarchy
- Vibrant gradients for headlines, stats, and buttons
- Subtle 3D animated backgrounds (Spline-style)
- Responsive/mobile-friendly layout
- Smooth transitions and floating effects

---

## 7. Technical Considerations

- React 18 (Vite, TailwindCSS v3, Recharts)
- Flask backend, MongoDB for data, Redis for cache
- WebSocket for real-time notifications
- Polygon.io (primary), Finnhub (backup) APIs
- Gemini-1.5-Flash AI with Microsoft AutoGen multi-agent framework
- MongoDB for agent memory and conversation history
- Secure JWT-based authentication

---

## 8. Success Metrics

- MVP delivered within 1 day
- 100% functional core features (auth, dashboard, portfolio, AI chat, notifications)
- <2s page load time
- Zero critical bugs in user/admin flows
- Positive user feedback on UI/UX
- Real-time alerts delivered reliably

---

## 9. Open Questions

- Should the app support mobile-first design for all features?
- Should admins be able to edit user details or only view/search/filter?
- Any additional compliance/privacy requirements (GDPR, etc.)?
- Should users be able to delete their account/data?
- Are there additional mockups or design references beyond the provided HTML sample?

---

**End of PRD for Alpha Insights**
