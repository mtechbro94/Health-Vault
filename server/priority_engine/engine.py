from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import List, Optional

class RequestType(Enum):
    ACCIDENT = "ACCIDENT"
    SURGERY = "SURGERY"
    CHILDBIRTH = "CHILDBIRTH"
    THALASSEMIA = "THALASSEMIA"

@dataclass
class BloodRequest:
    request_id: str
    request_type: RequestType
    blood_group: str
    units_required: int
    request_time: datetime
    hospital_id: str
    notes: Optional[str] = ""

@dataclass
class PriorityResult:
    request_id: str
    score: int
    is_critical: bool
    escalation_reason: Optional[str]
    classification_log: List[str]

class PriorityEngine:
    """
    Deterministic and auditable engine for prioritizing blood requests.
    """
    
    BASE_SCORES = {
        RequestType.ACCIDENT: 90,
        RequestType.SURGERY: 75,
        RequestType.CHILDBIRTH: 80,
        RequestType.THALASSEMIA: 60
    }

    CRITICAL_THRESHOLD = 85

    @staticmethod
    def calculate_priority(request: BloodRequest, current_time: Optional[datetime] = None) -> PriorityResult:
        """
        Calculates urgency score based on medical context, time decay, and demand.
        Pure function (deterministic if current_time is provided).
        """
        if current_time is None:
            current_time = datetime.now()

        log = []
        score = 0
        
        # 1. Base Priority
        if request.request_type not in PriorityEngine.BASE_SCORES:
            raise ValueError(f"Invalid request type: {request.request_type}")
            
        base_score = PriorityEngine.BASE_SCORES[request.request_type]
        score += base_score
        log.append(f"Base Score ({request.request_type.value}): +{base_score}")

        # 2. Time Decay (+1 point every 10 minutes)
        # Calculate duration in minutes
        duration = current_time - request.request_time
        minutes_passed = int(duration.total_seconds() / 60)
        
        if minutes_passed > 0:
            time_points = minutes_passed // 10
            if time_points > 0:
                score += time_points
                log.append(f"Time Decay ({minutes_passed} min): +{time_points}")

        # 3. Demand Pressure
        # +5 if >= 3, +10 if >= 5
        if request.units_required >= 5:
            score += 10
            log.append(f"Demand Pressure (Units {request.units_required} >= 5): +10")
        elif request.units_required >= 3:
            score += 5
            log.append(f"Demand Pressure (Units {request.units_required} >= 3): +5")

        # 4. Cap Score at 100
        original_score = score
        score = min(score, 100)
        if original_score > 100:
            log.append(f"Score Capped (Original: {original_score}): 100")

        # 5. Auto-Escalation
        is_critical = score >= PriorityEngine.CRITICAL_THRESHOLD
        escalation_reason = None
        
        if is_critical:
            reasons = []
            if base_score >= 80:
                reasons.append("High Base Priority")
            if minutes_passed > 60:
                reasons.append("Significant Delay")
            if request.units_required >= 5:
                reasons.append("High Demand")
            
            # Default reason if complex combo
            if not reasons:
                reasons.append("Composite Urgency")
                
            escalation_reason = f"CRITICAL ESCALATION: {', '.join(reasons)}"
            log.append(f"STATUS: {escalation_reason}")

        return PriorityResult(
            request_id=request.request_id,
            score=score,
            is_critical=is_critical,
            escalation_reason=escalation_reason,
            classification_log=log
        )
