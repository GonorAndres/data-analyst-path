"""Reserve identities and unsupported company-level BF selections."""
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

import pandas as pd
from fastapi import HTTPException

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))
from insurance_backend import data_loader  # noqa: E402
from insurance_backend.routers.loss_triangle import cl_vs_bf, loss_triangle  # noqa: E402


class TriangleBasisTests(unittest.TestCase):
    def setUp(self):
        self.triangles = pd.DataFrame([
            {"GRCODE": 1, "line_of_business": "auto", "AccidentYear": 1996,
             "DevelopmentYear": 1996, "DevelopmentLag": 1, "IncurLoss": 120, "CumPaidLoss": 60},
            {"GRCODE": 1, "line_of_business": "auto", "AccidentYear": 1996,
             "DevelopmentYear": 1997, "DevelopmentLag": 2, "IncurLoss": 150, "CumPaidLoss": 100},
            {"GRCODE": 1, "line_of_business": "auto", "AccidentYear": 1997,
             "DevelopmentYear": 1997, "DevelopmentLag": 1, "IncurLoss": 60, "CumPaidLoss": 40},
        ])
        self.reserves = pd.DataFrame([
            {"line_of_business": "auto", "accident_year": 1996, "ibnr_bf": 70,
             "ultimate_bf": 170, "ibnr_cl_paid": 0, "ultimate_cl_paid": 100,
             "ibnr_cl_incurred": 0, "ultimate_cl_incurred": 150},
            {"line_of_business": "auto", "accident_year": 1997, "ibnr_bf": 50,
             "ultimate_bf": 90, "ibnr_cl_paid": 27, "ultimate_cl_paid": 67,
             "ibnr_cl_incurred": 15, "ultimate_cl_incurred": 75},
        ])
        self.enterContext(patch.object(data_loader, "triangles", self.triangles))
        self.enterContext(patch.object(data_loader, "ibnr_results", self.reserves))
        self.params = dict(lob=None, company=None, year_start=None, year_end=None)

    def test_bf_residual_uses_selected_observed_basis(self):
        paid = loss_triangle(**self.params, type="paid", method="bf")["ibnr_by_year"]
        incurred = loss_triangle(**self.params, type="incurred", method="bf")["ibnr_by_year"]
        self.assertEqual([row["ibnr"] for row in paid], [70, 50])
        self.assertEqual([row["ibnr"] for row in incurred], [20, 30])
        for row in paid + incurred:
            self.assertEqual(row["latest_value"] + row["ibnr"], row["ultimate"])

    def test_comparison_uses_common_observed_baseline(self):
        rows = cl_vs_bf(**self.params, type="incurred")["comparison"]
        self.assertEqual([row["bf_ibnr"] for row in rows], [20, 30])
        for row in rows:
            self.assertEqual(row["bf_ibnr"] - row["cl_ibnr"], row["bf_ultimate"] - row["cl_ultimate"])

    def test_company_bf_and_comparison_are_unavailable(self):
        params = {**self.params, "company": 1}
        with self.assertRaises(HTTPException) as error:
            loss_triangle(**params, type="paid", method="bf")
        self.assertEqual(error.exception.status_code, 422)
        with self.assertRaises(HTTPException):
            cl_vs_bf(**params, type="paid")
        self.assertTrue(loss_triangle(**params, type="paid", method="cl")["ibnr_by_year"])

    def test_missing_bf_never_returns_cl_as_bf(self):
        with patch.object(data_loader, "ibnr_results", pd.DataFrame()):
            with self.assertRaises(HTTPException):
                loss_triangle(**self.params, type="paid", method="bf")
        with patch.object(data_loader, "ibnr_results", self.reserves.iloc[:1]):
            rows = loss_triangle(**self.params, type="paid", method="bf")["ibnr_by_year"]
            self.assertIsNone(rows[1]["ultimate"])
            self.assertIsNone(rows[1]["ibnr"])


if __name__ == "__main__":
    unittest.main()
