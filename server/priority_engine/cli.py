import json
import sys
from datetime import datetime
from engine import PriorityEngine, BloodRequest, RequestType

def main():
    try:
        # Read JSON string from command line argument
        if len(sys.argv) < 2:
            print(json.dumps({"error": "No input provided"}))
            return

        input_data = json.loads(sys.argv[1])
        
        # Parse inputs
        request_id = input_data.get("request_id", "TEMP_ID")
        request_type_str = input_data.get("request_type")
        blood_group = input_data.get("blood_group")
        units = int(input_data.get("units_required", 0))
        hospital_id = input_data.get("hospital_id")
        
        # Validate Request Type
        try:
            req_type = RequestType(request_type_str)
        except ValueError:
            print(json.dumps({"error": f"Invalid Request Type: {request_type_str}"}))
            return

        # Create Request Object
        req = BloodRequest(
            request_id=request_id,
            request_type=req_type,
            blood_group=blood_group,
            units_required=units,
            request_time=datetime.now(),
            hospital_id=hospital_id
        )

        # Calculate Priority
        result = PriorityEngine.calculate_priority(req)

        # Output Result as JSON
        output = {
            "score": result.score,
            "is_critical": result.is_critical,
            "escalation_reason": result.escalation_reason,
            "classification_log": result.classification_log
        }
        
        print(json.dumps(output))

    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()
