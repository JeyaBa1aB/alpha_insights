## Relevant Files

- `src/pages/LandingPage.tsx` - Main landing page with animated 3D background and feature highlights.
- `src/pages/LoginPage.tsx` - Login and signup page with authentication logic.
- `src/pages/Dashboard.tsx` - User dashboard showing portfolio overview, stats, and charts.
- `src/pages/PortfolioPage.tsx` - Portfolio management page for manual stock entry and performance chart.
- `src/pages/StockResearchPage.tsx` - Stock research and analytics page.
- `src/pages/NotificationsCenter.tsx` - Notifications center for real-time price alerts and history.
- `src/pages/EducationHub.tsx` - Education hub for articles and guides.
- `src/pages/ProfileSettings.tsx` - User profile and settings management.
- `src/components/AIChatWidget.tsx` - Floating AI chat widget for multi-agent system.
- `src/admin/AdminDashboard.tsx` - Admin dashboard for analytics and system health.
- `src/admin/UserManagement.tsx` - Admin user management page.
- `src/admin/SystemSettings.tsx` - Admin system and settings page.
- `src/components/GlassmorphicCard.tsx` - Reusable glassmorphic card component.
- `src/components/GradientButton.tsx` - Reusable gradient button component.
- `src/components/Chart.tsx` - Chart component using Recharts.
- `src/utils/api.ts` - API utility functions for Polygon.io, Finnhub, and backend.
- `src/utils/auth.ts` - Authentication utilities (JWT, AuthContext).
- `src/utils/websocket.ts` - WebSocket utilities for real-time notifications.
- `src/tests/LandingPage.test.tsx` - Unit tests for LandingPage.
- `src/tests/Dashboard.test.tsx` - Unit tests for Dashboard.
- `src/tests/PortfolioPage.test.tsx` - Unit tests for PortfolioPage.
- `src/tests/AIChatWidget.test.tsx` - Unit tests for AIChatWidget.
- `src/tests/AdminDashboard.test.tsx` - Unit tests for AdminDashboard.

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.


## Tasks

[x] 1.0 Set up project foundation and tech stack
  - [x] 1.1 Initialize Vite React project and configure TailwindCSS v3
  - [x] 1.2 Set up folder structure for pages, components, admin, and utils
  - [x] 1.3 Install and configure Recharts, React Router, and Inter font
  - [x] 1.4 Set up Flask backend with MongoDB and Redis integration
  - [x] 1.5 Configure WebSocket server for real-time notifications
  - [x] 1.6 Set up environment variables for API keys (Polygon.io, Finnhub)

[x] 2.0 Implement authentication and access control
  - [x] 2.1 Create MongoDB user model with role field ('user'/'admin')
  - [x] 2.2 Build authentication API endpoints (signup, login, password reset)
  - [x] 2.3 Implement JWT-based authentication and AuthContext in frontend
  - [x] 2.4 Create login/signup pages with glassmorphic UI
  - [x] 2.5 Secure admin account creation via backend only
  - [x] 2.6 Protect admin routes based on JWT role


[x] 3.0 Build user-facing pages and core features
  - [x] 3.1 Design and implement Landing Page with animated 3D background
  - [x] 3.2 Build User Dashboard with portfolio summary, stats, and charts
  - [x] 3.3 Create Portfolio Management page for manual stock entry and performance chart
  - [x] 3.4 Develop Stock Research page with search, metrics, and add-to-portfolio
  - [x] 3.5 Implement Notifications Center for real-time price alerts and history
  - [x] 3.6 Build Education Hub for articles and guides
  - [x] 3.7 Create Profile & Settings page for user info, password, and theme

[x] 4.0 Develop admin panel and system management
  - [x] 4.1 Build Admin Dashboard with analytics and system health indicators
  - [x] 4.2 Create User Management page with view/search/filter/edit capabilities
  - [x] 4.3 Develop System & Settings page for API key usage and Redis cache management


[x] 5.0 Create reusable UI components and design system
  - [x] 5.1 Implement GlassmorphicCard component
  - [x] 5.2 Build GradientButton component
  - [x] 5.3 Create Input Fields and Form components
  - [x] 5.4 Develop Chart component using Recharts
  - [x] 5.5 Design Modals and Tables with glassmorphic style
  - [x] 5.6 Implement Floating AI Chat Widget

- [ ] 6.0 Integrate APIs, real-time data, and AI agents
  - [ ] 6.1 Set up Polygon.io and Finnhub API integration in backend
  - [ ] 6.2 Connect frontend to backend API endpoints
  - [ ] 6.3 Implement WebSocket client for notifications
  - [ ] 6.4 Integrate Gemini-1.5-Flash AI and Microsoft AutoGen multi-agent framework
  - [ ] 6.5 Enable agent memory and conversation history in MongoDB
  - [ ] 6.6 Ensure context-aware responses and seamless agent handoff

- [ ] 7.0 Write unit tests and validate core flows
  - [ ] 7.1 Write unit tests for key pages and components (LandingPage, Dashboard, PortfolioPage, AIChatWidget, AdminDashboard)
  - [ ] 7.2 Test authentication and access control logic
  - [ ] 7.3 Validate API integration and error handling
  - [ ] 7.4 Test real-time notifications and WebSocket flows
  - [ ] 7.5 Review and validate UI/UX against design mandate

---

All parent tasks have been expanded into actionable sub-tasks. If you need further breakdowns or want to focus on a specific area, let me know!
