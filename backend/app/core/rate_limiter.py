from __future__ import annotations

from datetime import datetime, timedelta
from typing import Dict, Tuple


class RateLimiter:
    """
    Sistema de limitación de rate por IP.
    Almacena en memoria el contador de preguntas y timestamp del primer uso.
    """
    
    def __init__(self, max_questions: int = 8, window_hours: int = 2):
        """
        Args:
            max_questions: Número máximo de preguntas permitidas
            window_hours: Horas de espera después de alcanzar el límite
        """
        self.max_questions = max_questions
        self.window_hours = window_hours
        # Estructura: {ip: {"count": int, "first_request": datetime}}
        self._storage: Dict[str, Dict] = {}
    
    def check_limit(self, ip: str) -> Tuple[bool, str]:
        """
        Verifica si un IP puede hacer una pregunta.
        
        Args:
            ip: Dirección IP del cliente
            
        Returns:
            Tuple (puede_continuar, mensaje_error)
        """
        now = datetime.now()
        
        # Si el IP no está registrado, permitir y registrar
        if ip not in self._storage:
            self._storage[ip] = {
                "count": 0,
                "first_request": now
            }
            return True, ""
        
        user_data = self._storage[ip]
        first_request = user_data["first_request"]
        count = user_data["count"]
        
        # Calcular tiempo transcurrido
        time_elapsed = now - first_request
        reset_time = timedelta(hours=self.window_hours)
        
        # Si ya pasó el tiempo de bloqueo, resetear contador
        if time_elapsed >= reset_time:
            self._storage[ip] = {
                "count": 0,
                "first_request": now
            }
            return True, ""
        
        # Si no ha alcanzado el límite, permitir
        if count < self.max_questions:
            return True, ""
        
        # Ha alcanzado el límite, calcular tiempo restante
        time_remaining = reset_time - time_elapsed
        hours = int(time_remaining.total_seconds() // 3600)
        minutes = int((time_remaining.total_seconds() % 3600) // 60)
        
        message = (
            f"Has alcanzado el límite de {self.max_questions} preguntas. "
            f"Por favor espera {hours}h {minutes}m para poder continuar."
        )
        
        return False, message
    
    def increment(self, ip: str) -> None:
        """
        Incrementa el contador de preguntas para un IP.
        
        Args:
            ip: Dirección IP del cliente
        """
        if ip in self._storage:
            self._storage[ip]["count"] += 1
    
    def get_remaining_questions(self, ip: str) -> int:
        """
        Obtiene el número de preguntas restantes para un IP.
        
        Args:
            ip: Dirección IP del cliente
            
        Returns:
            Número de preguntas restantes
        """
        if ip not in self._storage:
            return self.max_questions
        
        count = self._storage[ip]["count"]
        remaining = max(0, self.max_questions - count)
        
        return remaining
