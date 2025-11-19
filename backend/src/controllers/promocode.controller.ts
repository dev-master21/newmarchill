import { Request, Response } from 'express';
import { PromoCodeService } from '../services/promocode.service';
import { asyncHandler } from '../middleware/error.middleware';

export const getAllPromoCodes = asyncHandler(async (req: Request, res: Response) => {
  const promoCodes = await PromoCodeService.findAll();
  
  res.json({
    success: true,
    promoCodes
  });
});

export const getPromoCode = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const promoCode = await PromoCodeService.findById(id);
  
  res.json({
    success: true,
    promoCode
  });
});

export const getPromoCodeStats = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const stats = await PromoCodeService.getUsageStats(id);
  
  res.json({
    success: true,
    stats
  });
});

export const createPromoCode = asyncHandler(async (req: Request, res: Response) => {
  const promoCode = await PromoCodeService.create(req.body);
  
  res.status(201).json({
    success: true,
    promoCode
  });
});

export const updatePromoCode = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const promoCode = await PromoCodeService.update(id, req.body);
  
  res.json({
    success: true,
    promoCode
  });
});

export const deletePromoCode = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  await PromoCodeService.delete(id);
  
  res.json({
    success: true,
    message: 'Promo code deleted successfully'
  });
});

export const validatePromoCode = asyncHandler(async (req: any, res: Response) => {
  const { code, cart_total, product_ids, currency } = req.body;
  const userId = req.user.id;
  
  const result = await PromoCodeService.validatePromoCode(
    code,
    userId,
    parseFloat(cart_total),
    currency || 'THB'
  );
  
  res.json(result);
});