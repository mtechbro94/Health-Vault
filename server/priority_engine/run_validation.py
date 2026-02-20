from datetime import datetime, timedelta
from engine import PriorityEngine, RequestType, BloodRequest, PriorityResult

def print_result(scenario: str, request: BloodRequest, result: PriorityResult):
    print(f"\n--- SCENARIO: {scenario} ---")
    print(f"Request: {request.request_type.name}, Units: {request.units_required}, Age: {(datetime.now() - request.request_time).seconds // 60} min")
    print(f"SCORE: {result.score} / 100")
    print(f"CRITICAL: {result.is_critical}")
    if result.is_critical:
        print(f"REASON: {result.escalation_reason}")
    print("LOGIC TRACE:")
    for log_item in result.classification_log:
        print(f"  > {log_item}")
    print("-" * 40)

def run_validation():
    print("=== EMERGENCY PRIORITY ENGINE VALIDATION RUN ===")
    start_time = datetime.now()
    
    # 1. Standard Accident
    # Context: Car crash, 2 units needed immediately.
    # Logic: Base 90. No delay. 2 units (<3). Score 90. Escalates (>=85).
    req1 = BloodRequest("R1", RequestType.ACCIDENT, "O-", 2, start_time, "H1")
    res1 = PriorityEngine.calculate_priority(req1, start_time)
    print_result("Standard Trauma", req1, res1)

    # 2. Delayed Surgery with High Demand
    # Context: Heart surgery, waiting 30 mins, needs 5 units.
    # Logic: Base 75. Time (+3 pts for 30m). Demand (+10 pts for 5u). Total 88. Escalates.
    req2 = BloodRequest("R2", RequestType.SURGERY, "A+", 5, start_time - timedelta(minutes=30), "H1")
    res2 = PriorityEngine.calculate_priority(req2, start_time)
    print_result("Complex Surgery Escalation", req2, res2)

    # 3. Routine Thalassemia
    # Context: Chronic need, no delay.
    # Logic: Base 60. No delay. Low demand. Score 60. No escalation.
    req3 = BloodRequest("R3", RequestType.THALASSEMIA, "B+", 1, start_time, "H1")
    res3 = PriorityEngine.calculate_priority(req3, start_time)
    print_result("Routine Chronic Care", req3, res3)

    # 4. Childbirth with Critical Delay
    # Context: Complication during labor, waiting 65 mins.
    # Logic: Base 80. Time (+6 pts for 60m). Total 86. Escalates.
    req4 = BloodRequest("R4", RequestType.CHILDBIRTH, "AB-", 2, start_time - timedelta(minutes=65), "H1")
    res4 = PriorityEngine.calculate_priority(req4, start_time)
    print_result("Obstetric Emergency with Delay", req4, res4)
    
    # 5. Mass Casualty Incident (Capping)
    # Context: Major disaster, 10 units, 2 hour delay.
    # Logic: Base 90. Time (+12). Demand (+10). Raw 112. Cap at 100.
    req5 = BloodRequest("R5", RequestType.ACCIDENT, "O-", 10, start_time - timedelta(minutes=120), "H1")
    res5 = PriorityEngine.calculate_priority(req5, start_time)
    print_result("Mass Casualty (Max Score Cap)", req5, res5)

if __name__ == "__main__":
    run_validation()
