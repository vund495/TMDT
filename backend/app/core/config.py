from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Nền tảng TMDT Gốm sứ Bát Tràng"
    debug: bool = True

    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    database_url: str = ""
    supabase_jwt_secret: str = ""
    supabase_jwks_url: str = ""

    vietqr_client_id: str = ""
    vietqr_api_key: str = ""
    bank_bin: str = ""
    account_no: str = ""
    account_name: str = ""

    casso_api_key: str = ""
    casso_webhook_secret: str = ""

    vnpay_tmn_code: str = ""
    vnpay_hash_secret: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()
