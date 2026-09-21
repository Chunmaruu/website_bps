import { Review, AdminDesa, AdminBps } from '../models/index.js';

/**
 * Mengambil seluruh ulasan untuk templat tertentu
 */
export const getTemplateReviews = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: 'error',
        message: 'ID templat diperlukan.',
      });
    }

    const reviews = await Review.findAll({
      where: { template_id: id },
      order: [['created_at', 'DESC']],
    });

    const totalReviews = reviews.length;
    let averageRating = 0;
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    if (totalReviews > 0) {
      const sum = reviews.reduce((acc, r) => {
        const star = Math.min(5, Math.max(1, r.rating));
        breakdown[star] = (breakdown[star] || 0) + 1;
        return acc + r.rating;
      }, 0);
      averageRating = parseFloat((sum / totalReviews).toFixed(1));
    }

    res.json({
      status: 'success',
      data: {
        template_id: id,
        totalReviews,
        averageRating,
        breakdown,
        reviews,
      },
    });
  } catch (error) {
    console.error('Error in getTemplateReviews:', error);
    res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil ulasan templat.',
      error: error.message,
    });
  }
};

/**
 * Mengirim atau memperbarui ulasan templat oleh akun desa atau admin BPS
 */
export const submitReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, komentar } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!id) {
      return res.status(400).json({
        status: 'error',
        message: 'ID templat wajib disertakan.',
      });
    }

    const numRating = parseInt(rating, 10);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({
        status: 'error',
        message: 'Rating harus berupa angka antara 1 sampai 5 bintang.',
      });
    }

    // Tentukan nama reviewer berdasarkan data akun
    let reviewerName = 'Pengguna Terverifikasi';
    if (userRole === 'desa') {
      const desa = await AdminDesa.findByPk(userId);
      if (desa) {
        reviewerName = `${desa.nama_desa}`;
      }
    } else if (userRole === 'bps') {
      const bps = await AdminBps.findByPk(userId);
      if (bps) {
        reviewerName = `${bps.nama} (BPS Subang)`;
      }
    }

    // Cek apakah akun ini sudah pernah mengulas templat ini
    let review = await Review.findOne({
      where: {
        template_id: id,
        user_id: userId,
        user_role: userRole,
      },
    });

    if (review) {
      // Perbarui ulasan yang ada
      review.rating = numRating;
      review.komentar = komentar ? komentar.trim() : '';
      review.reviewer_name = reviewerName;
      await review.save();
    } else {
      // Buat ulasan baru
      review = await Review.create({
        template_id: id,
        user_id: userId,
        user_role: userRole,
        reviewer_name: reviewerName,
        rating: numRating,
        komentar: komentar ? komentar.trim() : '',
      });
    }

    // Hitung rata-rata terbaru
    const allReviews = await Review.findAll({ where: { template_id: id } });
    const totalReviews = allReviews.length;
    const sum = allReviews.reduce((acc, r) => acc + r.rating, 0);
    const averageRating = totalReviews > 0 ? parseFloat((sum / totalReviews).toFixed(1)) : numRating;

    res.json({
      status: 'success',
      message: 'Ulasan dan rating berhasil disimpan ke database.',
      data: {
        review,
        averageRating,
        totalReviews,
      },
    });
  } catch (error) {
    console.error('Error in submitReview:', error);
    res.status(500).json({
      status: 'error',
      message: 'Gagal menyimpan ulasan ke database.',
      error: error.message,
    });
  }
};
