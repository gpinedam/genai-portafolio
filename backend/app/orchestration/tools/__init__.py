"""
Tools module for LangChain agent.

This module provides tools that enable the agent to interact with 
external systems like CSV storage and timezone queries.
"""

import os
from typing import List
from langchain_core.tools import BaseTool

__all__ = ["build_tools"]

# Configuration: enable/disable agent tools
# Can be overridden via environment variable: TOOLS_ENABLED=true
TOOLS_ENABLED = False


def build_tools() -> List[BaseTool]:
    """
    Construye lista de herramientas del agente.
    
    Las herramientas se cargan dinámicamente solo si TOOLS_ENABLED=True.
    
    Returns:
        Lista de tools de LangChain para el agente (vacía si están deshabilitadas).
    """
    if not TOOLS_ENABLED:
        return []
    
    from .csv_tool import append_contact_csv_handler
    from .time_tool import get_country_time_handler
    
    return [append_contact_csv_handler, get_country_time_handler]
