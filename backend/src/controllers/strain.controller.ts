import { Request, Response } from 'express';
import { StrainService } from '../services/strain.service';
import { AppError, asyncHandler } from '../middleware/error.middleware';

export const getStrains = asyncHandler(async (req: Request, res: Response) => {
  const strains = await StrainService.findAll();
  
  res.json({
    success: true,
    strains
  });
});

export const getStrain = asyncHandler(async (req: Request, res: Response) => {
  const strain = await StrainService.findById(parseInt(req.params.id));
  
  res.json({
    success: true,
    strain
  });
});

export const createStrain = asyncHandler(async (req: Request, res: Response) => {
  const strain = await StrainService.create(req.body);
  
  res.status(201).json({
    success: true,
    strain
  });
});

export const updateStrain = asyncHandler(async (req: Request, res: Response) => {
  const strain = await StrainService.update(parseInt(req.params.id), req.body);
  
  res.json({
    success: true,
    strain
  });
});

export const deleteStrain = asyncHandler(async (req: Request, res: Response) => {
  await StrainService.delete(parseInt(req.params.id));
  
  res.json({
    success: true,
    message: 'Strain deleted successfully'
  });
});