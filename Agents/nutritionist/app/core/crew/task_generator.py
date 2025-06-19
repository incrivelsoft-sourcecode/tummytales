from crewai import Task
from typing import Dict, Any

def create_task(description: str, agent, expected_output: str = "A comprehensive response") -> Task:
    """
    Create a task for the agent
    
    Args:
        description: Task description
        agent: The agent to assign this task to
        expected_output: Expected output description
    
    Returns:
        CrewAI Task
    """
    return Task(
        description=description,
        expected_output=expected_output,
        agent=agent
    )