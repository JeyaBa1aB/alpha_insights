#!/usr/bin/env python3
"""
Test script for the Enhanced Multi-Agent AI Chatbot System
Tests all 8 agents and validates proper routing and responses
"""

import sys
import os
import json
from datetime import datetime

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from app.services.ai_service import ai_service

def test_agent_routing():
    """Test that queries are routed to the correct agents"""
    
    test_cases = [
        # Navigation Agent tests
        {
            "query": "Where can I see my portfolio's performance?",
            "expected_agent": "Navigation Agent",
            "description": "Navigation query should route to Navigation Agent"
        },
        {
            "query": "How do I find the research tools?",
            "expected_agent": "Navigation Agent", 
            "description": "UI navigation question"
        },
        
        # Alert Agent tests
        {
            "query": "Set an alert for TSLA if it drops below $180",
            "expected_agent": "Alert Agent",
            "description": "Price alert setup should route to Alert Agent"
        },
        {
            "query": "I want to track price changes for AAPL",
            "expected_agent": "Alert Agent",
            "description": "Price tracking request"
        },
        
        # Suggestion Agent tests
        {
            "query": "Can you suggest a good dividend stock?",
            "expected_agent": "Suggestion Agent",
            "description": "Investment suggestion should route to Suggestion Agent"
        },
        {
            "query": "What would you recommend for a conservative portfolio?",
            "expected_agent": "Suggestion Agent",
            "description": "Portfolio recommendation request"
        },
        
        # Portfolio Agent tests
        {
            "query": "Analyze my portfolio allocation",
            "expected_agent": "Portfolio Agent",
            "description": "Portfolio analysis should route to Portfolio Agent"
        },
        
        # Research Agent tests
        {
            "query": "Research AAPL fundamentals",
            "expected_agent": "Research Agent",
            "description": "Stock research should route to Research Agent"
        },
        
        # Education Agent tests
        {
            "query": "Explain what P/E ratio means",
            "expected_agent": "Education Agent",
            "description": "Educational content should route to Education Agent"
        },
        
        # Support Agent tests
        {
            "query": "I'm having trouble with the platform",
            "expected_agent": "Support Agent",
            "description": "Support issues should route to Support Agent"
        }
    ]
    
    print("🧪 Testing Agent Routing...")
    print("=" * 60)
    
    passed = 0
    failed = 0
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\nTest {i}: {test_case['description']}")
        print(f"Query: '{test_case['query']}'")
        
        try:
            # Create test context
            context = {
                'user_id': 'test_user',
                'conversation_context': [],
                'current_timestamp': datetime.now().isoformat()
            }
            
            # Get AI response
            response = ai_service.route_query(test_case['query'], context)
            
            # Check if response is valid
            if not response or 'agent_name' not in response:
                print(f"❌ FAILED: No valid response received")
                failed += 1
                continue
            
            actual_agent = response.get('agent_name', 'Unknown')
            expected_agent = test_case['expected_agent']
            
            print(f"Expected: {expected_agent}")
            print(f"Actual: {actual_agent}")
            
            # Check if routing is correct
            if expected_agent.lower() in actual_agent.lower():
                print(f"✅ PASSED: Correctly routed to {actual_agent}")
                print(f"Response: {response.get('response', '')[:100]}...")
                passed += 1
            else:
                print(f"❌ FAILED: Expected {expected_agent}, got {actual_agent}")
                failed += 1
                
        except Exception as e:
            print(f"❌ ERROR: {str(e)}")
            failed += 1
    
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {passed} passed, {failed} failed")
    print(f"Success Rate: {(passed / (passed + failed)) * 100:.1f}%")
    
    return passed, failed

def test_agent_personalities():
    """Test that agents respond with appropriate personalities and brevity"""
    
    print("\n🎭 Testing Agent Personalities and Response Quality...")
    print("=" * 60)
    
    personality_tests = [
        {
            "agent": "Portfolio Agent",
            "query": "How should I diversify my portfolio?",
            "expected_traits": ["brief", "professional", "data-driven"]
        },
        {
            "agent": "Research Agent", 
            "query": "What are AAPL's key metrics?",
            "expected_traits": ["factual", "short", "metrics-focused"]
        },
        {
            "agent": "Support Agent",
            "query": "I can't find the settings page",
            "expected_traits": ["clear", "direct", "step-by-step"]
        },
        {
            "agent": "Education Agent",
            "query": "What is compound interest?",
            "expected_traits": ["concise", "bullet points", "clear definitions"]
        }
    ]
    
    for test in personality_tests:
        print(f"\nTesting {test['agent']} personality...")
        print(f"Query: '{test['query']}'")
        
        try:
            context = {'user_id': 'test_user'}
            response = ai_service.route_query(test['query'], context)
            
            if response and 'response' in response:
                response_text = response['response']
                word_count = len(response_text.split())
                
                print(f"Agent: {response.get('agent_name', 'Unknown')}")
                print(f"Word count: {word_count}")
                print(f"Response: {response_text[:200]}...")
                
                # Check for brevity (should be under 100 words for most responses)
                if word_count < 100:
                    print("✅ Response is appropriately brief")
                else:
                    print("⚠️  Response might be too long")
                    
            else:
                print("❌ No valid response received")
                
        except Exception as e:
            print(f"❌ ERROR: {str(e)}")

def test_multi_agent_coordination():
    """Test multi-agent coordination for complex queries"""
    
    print("\n🤝 Testing Multi-Agent Coordination...")
    print("=" * 60)
    
    complex_queries = [
        "I want to research AAPL and add it to my portfolio with price alerts",
        "Explain portfolio diversification and suggest some good stocks",
        "Compare AAPL vs MSFT and help me decide which to buy"
    ]
    
    for query in complex_queries:
        print(f"\nTesting complex query: '{query}'")
        
        try:
            context = {'user_id': 'test_user'}
            response = ai_service.route_query(query, context)
            
            if response:
                agent_name = response.get('agent_name', 'Unknown')
                print(f"Handling agent: {agent_name}")
                
                if 'multi-agent' in agent_name.lower() or 'coordinated' in agent_name.lower():
                    print("✅ Multi-agent coordination detected")
                    if 'participating_agents' in response:
                        print(f"Participating agents: {response['participating_agents']}")
                else:
                    print(f"ℹ️  Handled by single agent: {agent_name}")
                    
                print(f"Response length: {len(response.get('response', '').split())} words")
                
        except Exception as e:
            print(f"❌ ERROR: {str(e)}")

def test_system_health():
    """Test overall system health"""
    
    print("\n🏥 Testing System Health...")
    print("=" * 60)
    
    try:
        health = ai_service.health_check()
        
        print(f"Gemini API: {'✅ Connected' if health.get('gemini') else '❌ Failed'}")
        print(f"MongoDB: {'✅ Connected' if health.get('mongodb') else '❌ Failed'}")
        print(f"Agents initialized: {health.get('agents_initialized', 0)}")
        print(f"Agents with memory: {health.get('agents_with_memory', 0)}")
        print(f"Total conversations: {health.get('total_conversations', 0)}")
        
        # Test individual agents
        agent_status = health.get('agent_status', {})
        print(f"\nIndividual Agent Status:")
        for agent_name, status in agent_status.items():
            print(f"  {agent_name}: Memory items: {status.get('memory_items', 0)}, "
                  f"History: {status.get('conversation_history', 0)}")
        
        return health.get('gemini', False) and len(agent_status) >= 7  # Should have 7 agents
        
    except Exception as e:
        print(f"❌ Health check failed: {str(e)}")
        return False

def main():
    """Run all tests"""
    
    print("🚀 Alpha Insights Multi-Agent AI System Test Suite")
    print("=" * 60)
    print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test system health first
    if not test_system_health():
        print("\n❌ System health check failed. Please check your configuration.")
        return False
    
    # Run routing tests
    passed, failed = test_agent_routing()
    
    # Test personalities
    test_agent_personalities()
    
    # Test multi-agent coordination
    test_multi_agent_coordination()
    
    print("\n" + "=" * 60)
    print("🎉 Test Suite Complete!")
    
    if failed == 0:
        print("✅ All tests passed! The multi-agent system is working correctly.")
        return True
    else:
        print(f"⚠️  Some tests failed. Please review the results above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)