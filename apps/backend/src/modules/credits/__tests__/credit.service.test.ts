import { describe, expect, it, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import { creditService } from "../credit.service.js";
import { UserModel } from "../../auth/models/user.model.js";
import { CreditTransactionModel } from "../models/credit-transaction.model.js";
import { AppError } from "../../../common/exceptions/app-error.js";

// Mock Mongoose models
vi.mock("../../auth/models/user.model.js", () => {
  return {
    UserModel: {
      findById: vi.fn(),
      findOneAndUpdate: vi.fn(),
      findByIdAndUpdate: vi.fn(),
    },
  };
});

vi.mock("../models/credit-transaction.model.js", () => {
  return {
    CreditTransactionModel: {
      findOne: vi.fn(),
      findOneAndUpdate: vi.fn(),
      create: vi.fn(),
      find: vi.fn(),
      countDocuments: vi.fn(),
    },
  };
});

describe("CreditService", () => {
  const userId = new mongoose.Types.ObjectId().toString();
  const txId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("chargeCreditsChecked", () => {
    it("should return null if amount is <= 0", async () => {
      const result = await creditService.chargeCreditsChecked({
        userId,
        action: "semantic_search",
        amount: 0,
        idempotencyKey: "test-idempotency",
      });
      expect(result).toBeNull();
      expect(UserModel.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it("should return existing transaction on idempotency hit", async () => {
      const mockTx = { _id: txId, idempotencyKey: "idem-key", status: "applied" };
      vi.mocked(CreditTransactionModel.findOne).mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockTx),
      } as any);

      const result = await creditService.chargeCreditsChecked({
        userId,
        action: "fast_report",
        amount: 20,
        idempotencyKey: "idem-key",
      });

      expect(result).toEqual(mockTx);
      expect(CreditTransactionModel.findOne).toHaveBeenCalled();
      expect(UserModel.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it("should successfully charge credits and record transaction", async () => {
      vi.mocked(CreditTransactionModel.findOne).mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      } as any);

      const mockUser = { _id: userId, credits: 80 };
      vi.mocked(UserModel.findOneAndUpdate).mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockUser),
      } as any);

      const mockCreatedTx = {
        _id: txId,
        userId,
        type: "charge",
        action: "fast_report",
        amount: 20,
        balanceAfter: 80,
        idempotencyKey: "idem-key-2",
        status: "applied",
        toObject: vi.fn().mockReturnValue({ _id: txId, status: "applied" }),
      };
      vi.mocked(CreditTransactionModel.create).mockResolvedValue(mockCreatedTx as any);

      const result = await creditService.chargeCreditsChecked({
        userId,
        action: "fast_report",
        amount: 20,
        idempotencyKey: "idem-key-2",
      });

      expect(result).toEqual({ _id: txId, status: "applied" });
      expect(UserModel.findOneAndUpdate).toHaveBeenCalled();
      expect(CreditTransactionModel.create).toHaveBeenCalled();
    });

    it("should throw AppError badRequest if user has insufficient credits", async () => {
      vi.mocked(CreditTransactionModel.findOne).mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      } as any);

      vi.mocked(UserModel.findOneAndUpdate).mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      } as any);

      vi.mocked(UserModel.findById).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue({ _id: userId, credits: 10 }),
      } as any);

      await expect(
        creditService.chargeCreditsChecked({
          userId,
          action: "fast_report",
          amount: 20,
          idempotencyKey: "idem-key-3",
        }),
      ).rejects.toThrow(AppError);

      expect(UserModel.findOneAndUpdate).toHaveBeenCalled();
      expect(UserModel.findById).toHaveBeenCalled();
    });

    it("should rollback credit deduction and throw if ledger recording fails", async () => {
      vi.mocked(CreditTransactionModel.findOne).mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      } as any);

      const mockUser = { _id: userId, credits: 80 };
      vi.mocked(UserModel.findOneAndUpdate).mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockUser),
      } as any);

      vi.mocked(CreditTransactionModel.create).mockRejectedValue(new Error("Database write error") as any);
      vi.mocked(UserModel.findByIdAndUpdate).mockResolvedValue({} as any);

      await expect(
        creditService.chargeCreditsChecked({
          userId,
          action: "fast_report",
          amount: 20,
          idempotencyKey: "idem-key-4",
        }),
      ).rejects.toThrow(AppError);

      expect(UserModel.findOneAndUpdate).toHaveBeenCalled();
      expect(UserModel.findByIdAndUpdate).toHaveBeenCalledWith(userId, { $inc: { credits: 20 } });
    });
  });

  describe("refundCreditsOnce", () => {
    it("should skip refund if transaction is not found or already refunded", async () => {
      vi.mocked(CreditTransactionModel.findOneAndUpdate).mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      } as any);

      await creditService.refundCreditsOnce({ transactionId: txId });

      expect(CreditTransactionModel.findOneAndUpdate).toHaveBeenCalled();
      expect(UserModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should successfully refund credits and record refund transaction", async () => {
      const mockOriginalTx = {
        _id: txId,
        userId,
        type: "charge",
        action: "fast_report",
        amount: 20,
        status: "applied",
      };
      vi.mocked(CreditTransactionModel.findOneAndUpdate).mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockOriginalTx),
      } as any);

      vi.mocked(UserModel.findByIdAndUpdate).mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: userId, credits: 100 }),
      } as any);

      vi.mocked(CreditTransactionModel.create).mockResolvedValue({} as any);

      await creditService.refundCreditsOnce({ transactionId: txId, reason: "Test refund" });

      expect(CreditTransactionModel.findOneAndUpdate).toHaveBeenCalled();
      expect(UserModel.findByIdAndUpdate).toHaveBeenCalledWith(userId, { $inc: { credits: 20 } }, expect.any(Object));
      expect(CreditTransactionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "refund",
          amount: 20,
          balanceAfter: 100,
          refundedTransactionId: mockOriginalTx._id,
        }),
      );
    });
  });

  describe("getBalance", () => {
    it("should return the user's credits", async () => {
      vi.mocked(UserModel.findById).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue({ credits: 450 }),
      } as any);

      const balance = await creditService.getBalance(userId);
      expect(balance).toBe(450);
    });

    it("should throw AppError notFound if user does not exist", async () => {
      vi.mocked(UserModel.findById).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(null),
      } as any);

      await expect(creditService.getBalance(userId)).rejects.toThrow(AppError);
    });
  });
});
