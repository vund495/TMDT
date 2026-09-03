from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "VietCraft Bát Tràng - Nơi đất kể chuyện, lửa giữ hồn"
    debug: bool = True

    database_url: str = ""
    secret_key: str = "DEV_SECRET_CHANGE_ME_IN_PRODUCTION"

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
