from fastapi import APIRouter

from app.api.v1.admin import router as admin_router
from app.api.v1.auth import router as auth_router
from app.api.v1.cart import router as cart_router
from app.api.v1.disputes import router as disputes_router
from app.api.v1.feedback import router as feedback_router
from app.api.v1.marketplace import router as marketplace_router
from app.api.v1.orders import router as orders_router
from app.api.v1.payments import router as payments_router
from app.api.v1.product_passport import router as passport_router
from app.api.v1.promotions import router as promotions_router
from app.api.v1.reviews import router as reviews_router
from app.api.v1.shipping import router as shipping_router
from app.api.v1.tours import router as tours_router
from app.api.v1.users import router as users_router
from app.api.v1.workshop import router as workshop_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(marketplace_router)
api_router.include_router(cart_router)
api_router.include_router(passport_router)
api_router.include_router(workshop_router)
api_router.include_router(orders_router)
api_router.include_router(shipping_router)
api_router.include_router(payments_router)
api_router.include_router(tours_router)
api_router.include_router(promotions_router)
api_router.include_router(reviews_router)
api_router.include_router(disputes_router)
api_router.include_router(feedback_router)
api_router.include_router(admin_router)
