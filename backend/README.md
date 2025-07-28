# Alpha Insights Backend - Complete Refactored Architecture

## Overview

The Alpha Insights backend has been successfully refactored from a monolithic Flask application into a comprehensive, scalable, maintainable architecture using the Application Factory Pattern and Flask Blueprints. The system now includes complete API coverage with 9 specialized blueprints and 6 core services.

## Complete Architecture

### Directory Structure

```
backend/
├── app/                          # Main application package
│   ├── __init__.py              # Application factory
│   ├── extensions.py            # Flask extensions initialization
│   ├── models.py                # Database models and utilities
│   ├── routes/                  # Blueprint routes (9 blueprints)
│   │   ├── __init__.py
│   │   ├── auth.py             # Authentication & password reset
│   │   ├── admin.py            # Admin management & system stats
│   │   ├── portfolio.py        # Portfolio management & analytics
│   │   ├── market.py           # Market data & notifications
│   │   ├── ai.py               # AI chat & multi-agent system
│   │   ├── transactions.py     # Transaction CRUD operations
│   │   ├── education.py        # Educational content management
│   │   ├── user.py             # User profile & settings
│   │   └── health.py           # System health & testing utilities
│   └── services/               # Business logic services (6 services)
│       ├── ai_service.py        # Multi-agent AI with Gemini integration
│       ├── analytics_service.py # Advanced portfolio analytics
│       ├── market_data.py       # Polygon.io & Finnhub integration
│       ├── portfolio_service.py # Real-time portfolio calculations
│       ├── websocket_service.py # Real-time notifications
│       └── ai_service_fixed.py  # Clean AI service implementation
├── config.py                    # Configuration settings
├── run.py                      # Application entry point
├── seed.py                     # Database seeding script
├── test_factory.py             # Factory test script
└── requirements.txt            # Dependencies
```

### Key Improvements

1. **Separation of Concerns**: Routes, models, services, and configuration are now properly separated
2. **Scalability**: Blueprint-based architecture allows easy addition of new features
3. **Maintainability**: Clean code structure with logical organization
4. **Testability**: Application factory pattern enables easy testing
5. **Configuration Management**: Centralized configuration with environment-based settings

## Application Factory Pattern

The application is now created using the factory pattern in `app/__init__.py`:

```python
from app import create_app

app = create_app('development')  # or 'production', 'testing'
```

## Complete Blueprint Organization

### 1. Authentication Blueprint (`/`)
**Purpose**: User authentication and account management
- `POST /signup` - User registration with role assignment
- `POST /login` - JWT-based user authentication
- `POST /reset-password` - Password reset functionality

### 2. Admin Blueprint (`/admin`)
**Purpose**: Administrative functions and system management
- `GET /admin/protected` - Admin access verification
- `GET /admin/stats` - System statistics and health metrics
- `GET /admin/users` - List all users with pagination
- `PUT /admin/users/<id>` - Update user information
- `DELETE /admin/users/<id>` - Delete user account

### 3. Portfolio Blueprint (`/api/portfolio`)
**Purpose**: Portfolio management and analytics
- `GET /api/portfolio` - Portfolio summary with performance metrics
- `GET /api/portfolio/holdings` - Detailed holdings information
- `GET /api/portfolio/holdings/real-time` - Real-time holdings with live prices
- `GET /api/portfolio/activity` - Transaction history and activity
- `GET /api/portfolio/performance` - Historical performance data
- `GET /api/portfolio/risk-analysis` - Risk assessment and metrics
- `GET /api/portfolio/analytics` - Comprehensive portfolio analytics
- `GET /api/portfolio/asset-allocation` - Asset allocation by sector
- `GET /api/portfolio/risk-metrics` - Detailed risk metrics (Beta, Sharpe ratio)
- `GET /api/portfolio/real-time` - Real-time portfolio summary

### 4. Market Blueprint (`/api`)
**Purpose**: Market data and price alerts
- `GET /api/stocks/quote/<symbol>` - Real-time stock quotes
- `GET /api/stocks/search` - Stock symbol search
- `GET /api/stocks/historical/<symbol>` - Historical price data
- `GET /api/stocks/company/<symbol>` - Company information
- `GET /api/market/status` - Market status and indices
- `GET /api/notifications/alerts` - User's price alerts
- `POST /api/notifications/alerts` - Create price alert
- `DELETE /api/notifications/alerts/<id>` - Delete price alert
- `GET /api/notifications/stats` - Notification statistics

### 5. AI Blueprint (`/api/ai`)
**Purpose**: Multi-agent AI chat system
- `POST /api/ai/chat` - AI chat with intelligent agent routing
- `GET /api/ai/history` - Conversation history by agent
- `POST /api/ai/clear-history` - Clear conversation history
- `GET /api/ai/analytics` - User conversation analytics
- `POST /api/ai/suggestions` - AI-powered next action suggestions
- `GET /api/ai/export-history` - Export conversation history
- `GET /api/ai/conversation-flow` - Conversation flow analysis

### 6. Transactions Blueprint (`/api/transactions`)
**Purpose**: Transaction management and CRUD operations
- `POST /api/transactions` - Create new transaction (buy/sell)
- `GET /api/transactions` - Get transaction history with filters
- `PUT /api/transactions/<id>` - Update existing transaction
- `DELETE /api/transactions/<id>` - Delete transaction

### 7. Education Blueprint (`/api/education`)
**Purpose**: Educational content management
- `GET /api/education/articles` - Get all articles (with category filter)
- `GET /api/education/articles/<id>` - Get single article with full content

### 8. User Blueprint (`/api/user`)
**Purpose**: User profile and settings management
- `GET /api/user/profile` - Get current user's profile
- `PUT /api/user/profile` - Update user profile (username, email, password)
- `GET /api/user/settings` - Get user preferences and settings
- `PUT /api/user/settings` - Update user settings and preferences

### 9. Health Blueprint (`/api`)
**Purpose**: System health monitoring and testing utilities
- `GET /api/health` - Comprehensive system health check
- `POST /api/create-test-user` - Create test user for development
- `GET /api/database-stats` - Database statistics and metrics
- `POST /api/clear-test-data` - Clear test data (development only)

## Core Services Architecture

The backend is powered by 6 specialized services that handle business logic and external integrations:

### 1. AI Service (`services/ai_service.py`)
**Purpose**: Multi-agent AI system with Gemini-1.5-Flash integration
- **Multi-Agent Framework**: Portfolio, Research, Education, Support, and Alerts specialists
- **Intelligent Routing**: Master agent routes queries to appropriate specialists
- **Memory System**: MongoDB-based conversation history and long-term memory
- **Context Awareness**: Personalized responses based on user expertise and history
- **Multi-Agent Coordination**: Complex queries handled by multiple agents
- **Gemini Integration**: Google's Gemini-1.5-Flash for response generation

### 2. Market Data Service (`services/market_data.py`)
**Purpose**: Real-time market data with dual API integration
- **Primary**: Polygon.io API for professional-grade market data
- **Backup**: Finnhub API for redundancy and additional coverage
- **Real-time Quotes**: Live stock prices and market data
- **Historical Data**: Price history and technical indicators
- **Company Information**: Fundamental data and company profiles
- **Market Status**: Trading hours and market indices
- **Rate Limiting**: Built-in API rate limiting and error handling

### 3. Portfolio Service (`services/portfolio_service.py`)
**Purpose**: Real-time portfolio calculations and management
- **Live Calculations**: Real-time portfolio value using current market prices
- **Redis Caching**: High-performance caching for frequent calculations
- **Holdings Analysis**: Detailed position analysis with P&L calculations
- **Performance Tracking**: Historical performance and returns analysis
- **Risk Assessment**: Portfolio risk metrics and volatility analysis
- **Asset Allocation**: Sector and geographic diversification analysis

### 4. Analytics Service (`services/analytics_service.py`)
**Purpose**: Advanced portfolio analytics and risk management
- **Risk Metrics**: Beta, Sharpe ratio, VaR, maximum drawdown calculations
- **Asset Allocation**: Sector analysis and diversification scoring
- **Performance Attribution**: Return analysis and benchmark comparison
- **Correlation Analysis**: Inter-asset correlation and portfolio optimization
- **Monte Carlo Simulation**: Risk modeling and scenario analysis
- **Modern Portfolio Theory**: Efficient frontier and optimization algorithms

### 5. WebSocket Service (`services/websocket_service.py`)
**Purpose**: Real-time notifications and live updates
- **Price Alerts**: Real-time price monitoring and alert triggers
- **Portfolio Updates**: Live portfolio value changes and notifications
- **Market Updates**: Real-time market data streaming
- **User Sessions**: WebSocket connection management per user
- **Background Monitoring**: Continuous price and portfolio monitoring
- **Notification Types**: Price alerts, portfolio updates, system notifications

### 6. Database Models (`app/models.py`)
**Purpose**: MongoDB data models and database operations
- **User Management**: User accounts, authentication, and profiles
- **Portfolio Models**: Portfolio structure and holdings management
- **Transaction Models**: Buy/sell transaction recording and history
- **AI Memory Models**: Conversation history and agent memory storage
- **Price Alert Models**: Alert configuration and trigger management
- **Education Models**: Article storage and content management

## Configuration

Configuration is now centralized in `config.py` with support for different environments:

- **Development**: Debug enabled, local database
- **Production**: Optimized for production deployment
- **Testing**: Isolated test environment

## Running the Application

### Development
```bash
cd backend
python run.py
```

### Production
```bash
cd backend
export FLASK_ENV=production
python run.py
```

### Testing the Factory
```bash
cd backend
python test_factory.py
```

## Environment Variables

Create a `.env` file in the backend directory:

```env
SECRET_KEY=your-secret-key
MONGO_URI=mongodb://localhost:27017/alpha_insights
REDIS_HOST=localhost
REDIS_PORT=6379
FLASK_ENV=development
HOST=127.0.0.1
PORT=5003
```

## Migration Notes

### What Changed
1. **Monolithic `app.py`** → **Modular blueprint structure**
2. **Inline configuration** → **Centralized config management**
3. **Direct imports** → **Application factory pattern**
4. **Single file** → **Organized package structure**

### What Stayed the Same
1. **API endpoints** - All existing endpoints work unchanged
2. **Database models** - Same functionality, better organized
3. **Services** - Moved but functionality preserved
4. **Authentication** - JWT implementation unchanged

### Benefits Achieved
- ✅ **Scalability**: Easy to add new features and routes
- ✅ **Maintainability**: Clear separation of concerns
- ✅ **Testability**: Factory pattern enables comprehensive testing
- ✅ **Professional Structure**: Industry-standard Flask architecture
- ✅ **Team Collaboration**: Multiple developers can work on different blueprints
- ✅ **Deployment Ready**: Environment-based configuration

## Next Steps

1. **Add comprehensive tests** for each blueprint
2. **Implement API versioning** (e.g., `/api/v1/`)
3. **Add request validation** using Flask-RESTful or similar
4. **Implement caching** strategies for frequently accessed data
5. **Add API documentation** using Flask-RESTX or similar
6. **Set up logging** configuration for different environments

The refactored architecture provides a solid foundation for scaling the Alpha Insights platform while maintaining code quality and developer productivity.