"""
Configuration constants for the User Risk Assessment mathematical model.
These values represent the parameters derived from the Executive Survey.
"""

# Risk formula parameters: C = 1 / (1 + exp(-(aK + bS + cE + d(K*E) + int_e(S*E) - t)))
# where int_e represents the parameter 'e' from the formula, renamed to avoid conflicts.

RISK_WEIGHT_A = 1.0
RISK_WEIGHT_B = 1.0
RISK_WEIGHT_C = 1.0
RISK_WEIGHT_D = 1.0
RISK_WEIGHT_E = 1.0
RISK_WEIGHT_T = 1.0

# Hardcoded Sentiment (S) factor since the user survey isn't implemented yet.
HARDCODED_S_FACTOR = 0.5
