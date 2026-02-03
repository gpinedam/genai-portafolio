"""Tests para el sistema de rate limiting."""
from __future__ import annotations

from datetime import datetime, timedelta
import pytest

from app.core.rate_limiter import RateLimiter


def test_rate_limiter_allows_initial_requests():
    """Test que permite las primeras peticiones."""
    limiter = RateLimiter(max_questions=3, window_hours=1)
    
    # Primera petición debería ser permitida
    can_proceed, error = limiter.check_limit("192.168.1.1")
    assert can_proceed is True
    assert error == ""


def test_rate_limiter_increments_counter():
    """Test que incrementa el contador correctamente."""
    limiter = RateLimiter(max_questions=3, window_hours=1)
    ip = "192.168.1.1"
    
    # Permitir y hacer 3 preguntas
    for i in range(3):
        can_proceed, _ = limiter.check_limit(ip)
        assert can_proceed is True
        limiter.increment(ip)
    
    # La cuarta pregunta debería estar bloqueada
    can_proceed, error = limiter.check_limit(ip)
    assert can_proceed is False
    assert "límite" in error.lower()


def test_rate_limiter_different_ips():
    """Test que diferentes IPs tienen contadores independientes."""
    limiter = RateLimiter(max_questions=2, window_hours=1)
    
    # IP 1 hace 2 preguntas
    for _ in range(2):
        limiter.check_limit("192.168.1.1")
        limiter.increment("192.168.1.1")
    
    # IP 1 está bloqueada
    can_proceed, _ = limiter.check_limit("192.168.1.1")
    assert can_proceed is False
    
    # IP 2 puede hacer preguntas
    can_proceed, _ = limiter.check_limit("192.168.1.2")
    assert can_proceed is True


def test_rate_limiter_remaining_questions():
    """Test que calcula correctamente las preguntas restantes."""
    limiter = RateLimiter(max_questions=5, window_hours=1)
    ip = "192.168.1.1"
    
    # Inicialmente tiene 5 preguntas
    remaining = limiter.get_remaining_questions(ip)
    assert remaining == 5
    
    # Después de 2 preguntas, quedan 3
    limiter.check_limit(ip)
    limiter.increment(ip)
    limiter.check_limit(ip)
    limiter.increment(ip)
    
    remaining = limiter.get_remaining_questions(ip)
    assert remaining == 3


def test_rate_limiter_reset_after_window():
    """Test que resetea el contador después del tiempo de espera."""
    limiter = RateLimiter(max_questions=2, window_hours=1)
    ip = "192.168.1.1"
    
    # Hacer 2 preguntas
    limiter.check_limit(ip)
    limiter.increment(ip)
    limiter.check_limit(ip)
    limiter.increment(ip)
    
    # Verificar que está bloqueado
    can_proceed, _ = limiter.check_limit(ip)
    assert can_proceed is False
    
    # Simular que pasó el tiempo (modificando el timestamp)
    limiter._storage[ip]["first_request"] = datetime.now() - timedelta(hours=2)
    
    # Ahora debería permitir de nuevo
    can_proceed, _ = limiter.check_limit(ip)
    assert can_proceed is True
    
    # Y el contador debería estar reseteado
    remaining = limiter.get_remaining_questions(ip)
    assert remaining == 2
