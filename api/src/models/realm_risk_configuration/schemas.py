from sqlmodel import SQLModel


class RealmRiskConfigurationRead(SQLModel):
    realm_name: str
    weight_a: float
    weight_b: float
    weight_c: float
    weight_d: float
    weight_e: float
    weight_t: float


class RealmRiskConfigurationPatch(SQLModel):
    weight_a: float | None = None
    weight_b: float | None = None
    weight_c: float | None = None
    weight_d: float | None = None
    weight_e: float | None = None
    weight_t: float | None = None
