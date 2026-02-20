import unittest
from datetime import datetime, timedelta
from engine import PriorityEngine, RequestType, BloodRequest

class TestPriorityEngine(unittest.TestCase):

    def setUp(self):
        self.now = datetime(2025, 1, 1, 12, 0, 0)
        self.hospital_id = "H-123"

    def create_request(self, r_type, units, time_offset_minutes=0):
        return BloodRequest(
            request_id="REQ-001",
            request_type=r_type,
            blood_group="A+",
            units_required=units,
            request_time=self.now - timedelta(minutes=time_offset_minutes),
            hospital_id=self.hospital_id
        )

    def test_accident_base_score(self):
        # Accident base is 90
        req = self.create_request(RequestType.ACCIDENT, units=1)
        res = PriorityEngine.calculate_priority(req, self.now)
        self.assertEqual(res.score, 90)
        self.assertTrue(res.is_critical) # 90 > 85

    def test_surgery_logic(self):
        # Surgery base is 75
        # 3 units -> +5
        # 25 mins delay -> +2
        # Total = 75 + 5 + 2 = 82
        req = self.create_request(RequestType.SURGERY, units=3, time_offset_minutes=25)
        res = PriorityEngine.calculate_priority(req, self.now)
        self.assertEqual(res.score, 82)
        self.assertFalse(res.is_critical)

    def test_childbirth_high_demand_escalation(self):
        # Childbirth base 80
        # 5 units -> +10
        # Total 90 -> Critical
        req = self.create_request(RequestType.CHILDBIRTH, units=5)
        res = PriorityEngine.calculate_priority(req, self.now)
        self.assertEqual(res.score, 90)
        self.assertTrue(res.is_critical)
        self.assertIn("High Demand", res.escalation_reason)

    def test_thalassemia_time_decay(self):
        # Thalassemia base 60
        # 100 mins delay -> +10
        # Total 70
        req = self.create_request(RequestType.THALASSEMIA, units=1, time_offset_minutes=100)
        res = PriorityEngine.calculate_priority(req, self.now)
        self.assertEqual(res.score, 70)

    def test_score_capping(self):
        # Accident (90) + 5 units (+10) + 200 mins delay (+20) = 120 -> Cap 100
        req = self.create_request(RequestType.ACCIDENT, units=6, time_offset_minutes=200)
        res = PriorityEngine.calculate_priority(req, self.now)
        self.assertEqual(res.score, 100)
        self.assertTrue(res.is_critical)

    def test_boundary_critical(self):
        # Surgery (75) + 100 mins (+10) = 85 -> Critical boundary
        req = self.create_request(RequestType.SURGERY, units=1, time_offset_minutes=100)
        res = PriorityEngine.calculate_priority(req, self.now)
        self.assertEqual(res.score, 85)
        self.assertTrue(res.is_critical)

    def test_invalid_type(self):
        req = self.create_request(RequestType.ACCIDENT, units=1)
        req.request_type = "INVALID_TYPE" # Mocking bad input if possible, or usually caught by typing
        # With enum, we might check runtime validation
        # But PriorityEngine expects RequestType enum. 
        # Actually calculate_priority checks dictionary.
        with self.assertRaises(Exception): # Key error or value error
            PriorityEngine.calculate_priority(req, self.now)

if __name__ == '__main__':
    unittest.main()
