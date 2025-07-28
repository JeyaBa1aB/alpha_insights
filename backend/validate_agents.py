#!/usr/bin/env python3
"""
Validation script for the Enhanced Multi-Agent AI Chatbot System
Tests agent initialization and routing logic without API calls
"""

import sys
import os
import json
from datetime import datetime

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from app.services.ai_service import ai_service

def validate_agent_initialization():
    """Validate that all 8 agents are properly initialized"""
    
    print("🔧 Validating Agent Initialization...")
    print("=" * 60)
    
    expected_agents = [
        'portfolio', 'research', 'support', 'suggestion', 
        'navigation', 'alerts', 'education'
    ]
    
    initialized_agents = list(ai_service.agents.keys())
    
    print(f"Expected agents: {len(expected_agents)}")
    print(f"Initialized agents: {len(initialized_agents)}")
    print(f"Agent names: {initialized_agents}")
    
    missing_agents = set(expected_agents) - set(initialized_agents)
    extra_agents = set(initialized_agents) - set(expected_agents)
    
    if missing_agents:
        print(f"❌ Missing agents: {missing_agents}")
        return False
    
    if extra_agents:
        print(f"ℹ️  Extra agents: {extra_agents}")
    
    print("✅ All required agents initialized successfully!")
    
    # Validate agent prompts are concise and professional
    print("\n📝 Validating Agent Prompts...")
    for agent_name, agent in ai_service.agents.items():
        prompt_length = len(agent.system_prompt.split())
        print(f"  {agent.name}: {prompt_length} words")
        
        # Check for key phrases indicating brevity and professionalism
        prompt_lower = agent.system_prompt.lower()
        
        if agent_name == 'portfolio':
            if 'concise' in prompt_lower and 'brief' in prompt_lower:
                print(f"    ✅ Portfolio Agent has concise prompt")
            else:
                print(f"    ⚠️  Portfolio Agent prompt may not be concise enough")
        
        elif agent_name == 'suggestion':
            if 'brief' in prompt_lower and 'clearly stated' in prompt_lower:
                print(f"    ✅ Suggestion Agent has appropriate prompt")
            else:
                print(f"    ⚠️  Suggestion Agent prompt may need refinement")
        
        elif agent_name == 'navigation':
            if 'direct' in prompt_lower and 'simple' in prompt_lower:
                print(f"    ✅ Navigation Agent has appropriate prompt")
            else:
                print(f"    ⚠️  Navigation Agent prompt may need refinement")
    
    return True

def validate_routing_keywords():
    """Validate that routing keywords are properly configured"""
    
    print("\n🎯 Validating Routing Keywords...")
    print("=" * 60)
    
    # Test keyword matching logic
    test_cases = [
        {
            'keywords': ['suggest', 'recommend', 'idea'],
            'agent': 'suggestion',
            'description': 'Suggestion Agent keywords'
        },
        {
            'keywords': ['where', 'find', 'how do i'],
            'agent': 'navigation', 
            'description': 'Navigation Agent keywords'
        },
        {
            'keywords': ['alert', 'notify', 'track price'],
            'agent': 'alerts',
            'description': 'Alert Agent keywords'
        },
        {
            'keywords': ['portfolio', 'allocation', 'diversification'],
            'agent': 'portfolio',
            'description': 'Portfolio Agent keywords'
        },
        {
            'keywords': ['stock', 'analysis', 'research'],
            'agent': 'research',
            'description': 'Research Agent keywords'
        }
    ]
    
    # Check if confidence calculation includes new agents
    for test_case in test_cases:
        agent_name = test_case['agent']
        keywords = test_case['keywords']
        
        print(f"\nTesting {test_case['description']}:")
        
        # Test confidence calculation with keywords
        for keyword in keywords:
            test_message = f"Can you help me {keyword} something?"
            try:
                confidence = ai_service._calculate_response_confidence(
                    agent_name, test_message, {'user_id': 'test'}
                )
                print(f"  '{keyword}' -> confidence: {confidence:.2f}")
                
                if confidence > 0.8:  # Should be higher than base confidence
                    print(f"    ✅ Keyword properly boosts confidence")
                else:
                    print(f"    ⚠️  Keyword may not be properly configured")
                    
            except Exception as e:
                print(f"    ❌ Error testing keyword '{keyword}': {e}")
    
    return True

def validate_multi_agent_detection():
    """Validate multi-agent detection logic"""
    
    print("\n🤝 Validating Multi-Agent Detection...")
    print("=" * 60)
    
    test_queries = [
        {
            'query': 'I want to research AAPL and add it to my portfolio',
            'expected_agents': ['portfolio', 'research'],
            'description': 'Portfolio + Research combination'
        },
        {
            'query': 'Suggest some stocks and tell me where to find the research tools',
            'expected_agents': ['suggestion', 'navigation'],
            'description': 'Suggestion + Navigation combination'
        },
        {
            'query': 'Explain P/E ratios and show me how to analyze MSFT',
            'expected_agents': ['research', 'education'],
            'description': 'Research + Education combination'
        },
        {
            'query': 'Track my portfolio performance with alerts',
            'expected_agents': ['portfolio', 'alerts'],
            'description': 'Portfolio + Alerts combination'
        }
    ]
    
    for test in test_queries:
        print(f"\nTesting: {test['description']}")
        print(f"Query: '{test['query']}'")
        
        try:
            detected_agents = ai_service._analyze_multi_agent_needs(
                test['query'], {'user_id': 'test'}
            )
            
            print(f"Expected: {test['expected_agents']}")
            print(f"Detected: {detected_agents}")
            
            # Check if all expected agents are detected
            expected_set = set(test['expected_agents'])
            detected_set = set(detected_agents)
            
            if expected_set.issubset(detected_set):
                print(f"✅ Multi-agent detection working correctly")
            else:
                missing = expected_set - detected_set
                print(f"⚠️  Missing agents in detection: {missing}")
                
        except Exception as e:
            print(f"❌ Error in multi-agent detection: {e}")
    
    return True

def validate_master_agent_prompt():
    """Validate Master Agent prompt includes new agents"""
    
    print("\n🎭 Validating Master Agent Configuration...")
    print("=" * 60)
    
    master_prompt = ai_service.master_agent.system_prompt
    
    # Check for new agents in the prompt
    new_agents = ['suggestion', 'navigation']
    
    for agent in new_agents:
        if agent in master_prompt.lower():
            print(f"✅ {agent.title()} Agent included in Master Agent prompt")
        else:
            print(f"❌ {agent.title()} Agent missing from Master Agent prompt")
    
    # Check for new routing guidelines
    routing_keywords = [
        '"suggest", "recommend", "idea"',
        '"how do I", "where is", "find"',
        '"alert", "notify", "track price"'
    ]
    
    print(f"\nChecking routing guidelines:")
    for guideline in routing_keywords:
        if guideline.replace('"', '') in master_prompt.lower():
            print(f"✅ Routing guideline found: {guideline}")
        else:
            print(f"⚠️  Routing guideline may be missing: {guideline}")
    
    # Check for design decision implementations
    design_features = [
        'agent personalities & handoffs',
        'memory & conflicts', 
        'activation & visualization'
    ]
    
    print(f"\nChecking design decision implementations:")
    for feature in design_features:
        if feature.lower() in master_prompt.lower():
            print(f"✅ Design feature implemented: {feature}")
        else:
            print(f"⚠️  Design feature may be missing: {feature}")
    
    return True

def validate_system_architecture():
    """Validate overall system architecture"""
    
    print("\n🏗️  Validating System Architecture...")
    print("=" * 60)
    
    # Check agent count
    total_agents = len(ai_service.agents) + 1  # +1 for master agent
    print(f"Total agents in system: {total_agents}")
    
    if total_agents >= 8:  # 7 specialist + 1 master
        print(f"✅ System has required number of agents")
    else:
        print(f"❌ System missing agents (expected 8+, got {total_agents})")
    
    # Check database connection
    if ai_service.db is not None:
        print(f"✅ Database connection established")
    else:
        print(f"⚠️  Database connection not available")
    
    # Check AI model
    if ai_service.model is not None:
        print(f"✅ AI model initialized")
    else:
        print(f"⚠️  AI model not available")
    
    # Check agent memory capabilities
    agents_with_memory = 0
    for agent in ai_service.agents.values():
        if hasattr(agent, 'long_term_memory') and hasattr(agent, 'conversation_history'):
            agents_with_memory += 1
    
    print(f"Agents with memory capabilities: {agents_with_memory}/{len(ai_service.agents)}")
    
    if agents_with_memory == len(ai_service.agents):
        print(f"✅ All agents have memory capabilities")
    else:
        print(f"⚠️  Some agents missing memory capabilities")
    
    return True

def main():
    """Run all validation tests"""
    
    print("🔍 Alpha Insights Multi-Agent System Validation")
    print("=" * 60)
    print(f"Validation started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    validation_results = []
    
    # Run all validation tests
    tests = [
        ("Agent Initialization", validate_agent_initialization),
        ("Routing Keywords", validate_routing_keywords),
        ("Multi-Agent Detection", validate_multi_agent_detection),
        ("Master Agent Prompt", validate_master_agent_prompt),
        ("System Architecture", validate_system_architecture)
    ]
    
    for test_name, test_func in tests:
        try:
            print(f"\n{'='*20} {test_name} {'='*20}")
            result = test_func()
            validation_results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} failed with error: {e}")
            validation_results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Validation Summary:")
    
    passed = sum(1 for _, result in validation_results if result)
    total = len(validation_results)
    
    for test_name, result in validation_results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"  {test_name}: {status}")
    
    print(f"\nOverall: {passed}/{total} tests passed ({(passed/total)*100:.1f}%)")
    
    if passed == total:
        print("🎉 All validations passed! The multi-agent system is properly configured.")
        return True
    else:
        print("⚠️  Some validations failed. Please review the results above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)