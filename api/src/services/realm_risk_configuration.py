from __future__ import annotations

from typing import Iterable

from sqlmodel import Session

from src.core import risk_config
from src.models.realm_risk_configuration import RealmRiskConfiguration

DEFAULT_WEIGHTS = {
    "weight_a": risk_config.RISK_WEIGHT_A,
    "weight_b": risk_config.RISK_WEIGHT_B,
    "weight_c": risk_config.RISK_WEIGHT_C,
    "weight_d": risk_config.RISK_WEIGHT_D,
    "weight_e": risk_config.RISK_WEIGHT_E,
    "weight_t": risk_config.RISK_WEIGHT_T,
}


def get_effective_realm_risk_configuration(
    session: Session, realm_name: str | None
) -> RealmRiskConfiguration:
    if not realm_name:
        return RealmRiskConfiguration(realm_name="", **DEFAULT_WEIGHTS)

    record = session.get(RealmRiskConfiguration, realm_name)
    if record:
        return record

    return RealmRiskConfiguration(realm_name=realm_name, **DEFAULT_WEIGHTS)


def upsert_realm_risk_configuration(
    session: Session, realm_name: str, **weights: float
) -> RealmRiskConfiguration:
    record = session.get(RealmRiskConfiguration, realm_name)
    if record is None:
        record = RealmRiskConfiguration(realm_name=realm_name, **DEFAULT_WEIGHTS)

    for field_name, value in weights.items():
        if value is not None and hasattr(record, field_name):
            setattr(record, field_name, value)

    session.add(record)
    session.commit()
    session.refresh(record)
    return record


def normalize_realm_name_candidates(candidates: Iterable[str | None]) -> str | None:
    for candidate in candidates:
        if candidate:
            return candidate
    return None
