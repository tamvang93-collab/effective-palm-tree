// Game List JavaScript
(async function() {
  // Wait for DOM to be ready first
  if (document.readyState === 'loading') {
    await new Promise(resolve => {
      document.addEventListener('DOMContentLoaded', resolve);
    });
  }
  
  // Clear stale localStorage data first
  localStorage.removeItem('current_user');
  console.log('🗑️ [GAME-LIST] Cleared stale user cache before loading');
  
  // Refresh user data from server khi load trang - ĐỢI XÁC NHẬN TRƯỚC
  await refreshUserDataOnLoad();
  
  // Lấy provider từ URL
  const urlParams = new URLSearchParams(window.location.search);
  const provider = urlParams.get('provider') || 'pg';
  
  // Thông tin providers
  const providers = {
    'pg': { name: 'PG', displayName: 'SẢNH PG' },
    'jili': { name: 'JILI', displayName: 'SẢNH JILI' },
    'fc': { name: 'FC FA CHAI', displayName: 'SẢNH FC' },
    'jdb': { name: 'JDB', displayName: 'SẢNH JDB' },
    'pragmatic': { name: 'PRAGMATIC PLAY', displayName: 'SẢNH PLAY' },
    'topplayer': { name: 'TOP PLAYER', displayName: 'SẢNH TP' },
    '168game': { name: '168GAME', displayName: 'SẢNH 168G' },
    'cq9': { name: 'CQ9', displayName: 'SẢNH CQ9' },
    'turbo': { name: 'TURBO GAMES', displayName: 'SẢNH TUBOR' },
    'microgaming': { name: 'MICROGAMING', displayName: 'SẢNH MG' }
  };
  
  // Function để convert tên game sang slug
  function gameNameToSlug(gameName) {
    const vietnameseMap = {
      'à': 'a', 'á': 'a', 'ạ': 'a', 'ả': 'a', 'ã': 'a', 'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ậ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ặ': 'a', 'ẳ': 'a', 'ẵ': 'a',
      'è': 'e', 'é': 'e', 'ẹ': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ê': 'e', 'ề': 'e', 'ế': 'e', 'ệ': 'e', 'ể': 'e', 'ễ': 'e',
      'ì': 'i', 'í': 'i', 'ị': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ı': 'i',
      'ò': 'o', 'ó': 'o', 'ọ': 'o', 'ỏ': 'o', 'õ': 'o', 'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ộ': 'o', 'ổ': 'o', 'ỗ': 'o', 'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ợ': 'o', 'ở': 'o', 'ỡ': 'o',
      'ù': 'u', 'ú': 'u', 'ụ': 'u', 'ủ': 'u', 'ũ': 'u', 'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ự': 'u', 'ử': 'u', 'ữ': 'u',
      'ỳ': 'y', 'ý': 'y', 'ỵ': 'y', 'ỷ': 'y', 'ỹ': 'y',
      'đ': 'd',
      'À': 'A', 'Á': 'A', 'Ạ': 'A', 'Ả': 'A', 'Ã': 'A', 'Â': 'A', 'Ầ': 'A', 'Ấ': 'A', 'Ậ': 'A', 'Ẩ': 'A', 'Ẫ': 'A', 'Ă': 'A', 'Ằ': 'A', 'Ắ': 'A', 'Ặ': 'A', 'Ẳ': 'A', 'Ẵ': 'A',
      'È': 'E', 'É': 'E', 'Ẹ': 'E', 'Ẻ': 'E', 'Ẽ': 'E', 'Ê': 'E', 'Ề': 'E', 'Ế': 'E', 'Ệ': 'E', 'Ể': 'E', 'Ễ': 'E',
      'Ì': 'I', 'Í': 'I', 'Ị': 'I', 'Ỉ': 'I', 'Ĩ': 'I', 'İ': 'I',
      'Ò': 'O', 'Ó': 'O', 'Ọ': 'O', 'Ỏ': 'O', 'Õ': 'O', 'Ô': 'O', 'Ồ': 'O', 'Ố': 'O', 'Ộ': 'O', 'Ổ': 'O', 'Ỗ': 'O', 'Ơ': 'O', 'Ờ': 'O', 'Ớ': 'O', 'Ợ': 'O', 'Ở': 'O', 'Ỡ': 'O',
      'Ù': 'U', 'Ú': 'U', 'Ụ': 'U', 'Ủ': 'U', 'Ũ': 'U', 'Ư': 'U', 'Ừ': 'U', 'Ứ': 'U', 'Ự': 'U', 'Ử': 'U', 'Ữ': 'U',
      'Ỳ': 'Y', 'Ý': 'Y', 'Ỵ': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y',
      'Đ': 'D'
    };
    
    let slug = gameName;
    
    // Chuyển đổi tiếng Việt
    for (let key in vietnameseMap) {
      slug = slug.replace(new RegExp(key, 'g'), vietnameseMap[key]);
    }
    
    // Chuyển về lowercase và thay thế khoảng trắng
    slug = slug.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')  // Thay thế ký tự đặc biệt thành -
      .replace(/^-+|-+$/g, '');     // Xóa - ở đầu và cuối
    
    return slug;
  }
  
  // Function để lấy đường dẫn ảnh game với fallback
  function getGameImagePath(gameName, providerCode) {
    const slug = gameNameToSlug(gameName);
    // Ưu tiên webp, sau đó thử png, jpg
    // Trả về webp trước, nếu fail sẽ thử format khác trong onerror
    return `assets/img/games/${providerCode}/${slug}.webp`;
  }
  
  // Function thử load ảnh với nhiều format
  function tryLoadImage(img, gameName, providerCode, formats = ['webp', 'png', 'jpg', 'jpeg']) {
    const slug = gameNameToSlug(gameName);
    let currentFormatIndex = 0;
    
    const tryNextFormat = () => {
      if (currentFormatIndex >= formats.length) {
        // Không có ảnh nào cả, hiển thị placeholder
        img.style.display = 'none';
        img.parentElement.classList.add('no-image');
        return;
      }
      
      const format = formats[currentFormatIndex];
      const path = `assets/img/games/${providerCode}/${slug}.${format}`;
      
      img.onerror = () => {
        currentFormatIndex++;
        tryNextFormat();
      };
      
      img.onload = () => {
        img.style.display = 'block';
        img.parentElement.classList.remove('no-image');
      };
      
      img.src = path;
    };
    
    tryNextFormat();
  }
  
  // Danh sách game theo từng provider
  const providerGames = {
    'pg': [
      'Quyết Chiến Giành Tiền Thưởng',
      'Rồng Vàng Tặng Bảo',
      'Thần May Mắn',
      'Chú Chuột May Mắn',
      'Chú Bò May Mắn',
      'Thỏ May Mắn',
      'Kho Báu Aztec',
      'Đường Mạt Chược 2',
      'Đường Mạt Chược',
      'Kỳ Lân Mách Nước',
      'Chiến Thắng Caishen',
      'Hổ May Mắn',
      'Neko May Mắn',
      'Vàng Giả Kim',
      'Cơn Thịnh Nộ Của Anubis',
      'Asgard Trỗi Dậy',
      'Tiệm Bánh Phát Đạt',
      'Kỳ Nghỉ Bali',
      'Cuộc Chiến Hoàng Gia',
      'Ngưu Đại Chiến',
      'Hoa Bướm',
      'Kho Báu Của Thuyền Trưởng',
      'Chicky Run',
      'Rạp Xiếc Nhiệm Màu',
      'Đêm Cocktail',
      'Kẹo Ngọt Bùng Nổ',
      'Kẹo Bonanza',
      'Thiên Đường Bikini',
      'Cơn Sốt Tiền',
      'Sôcôla Cao Cấp',
      'Du Thuyền Hoàng Gia',
      'Kripto Altın',
      'Kho Báu Người Chết',
      'Định Mệnh Của Mặt Trăng & Mặt Trời',
      'Bữa Tối Hân Hoan',
      'Vòng Quay Cơn Sốt Quán Ăn',
      'Cuồng Nộ Ngày Tận Thế',
      'Kho Báu Khổng Lồ',
      'Tìm Rồng – Khám Phá Báu Vật 2',
      'Truyền Thuyết Rồng',
      'Rồng Hổ May Mắn'
    ],
    'jili': [
      'Siêu Cấp Ace',
      'Quyền Vương',
      'Baby Kẹo Ngọt',
      'Nữ Thần Tế Aztec',
      'Bảo Thạch Kala',
      'Thần Long Đoạt Bảo',
      '10 Sparkling Crown',
      '3 Trâu Sạc',
      '3 Kho Báu Đồng Xu 2',
      '3 Kho Báu Đồng Xu',
      'Ali Baba',
      'Chiến Binh Đấu Trường',
      'Bao Thanh Thiên',
      'Tháng Khánh Điển',
      'Thợ Săn Tiền Thưởng',
      'Quyển Sách Hoàng Kim',
      'Nàng Tiên Cá Ngọt Ngào',
      'Tính Phí Buffalo Ascent',
      'Trâu Rừng Xung Phong',
      'Truyền Thuyết Tần Vương',
      'Vô Cực Xu',
      'Cây Tiền',
      'Điên Cuồng 777',
      'Điên Cuồng Phát Đại Tài',
      'Crazy Pusher',
      'Cricket King 18',
      'Cricket Sah 75',
      'Crystal 777 Cao Cấp',
      'Dabanggg',
      'Lửa Quỷ 2',
      'Lửa Quỷ',
      'Buổi Tiệc Đá Quý',
      'Ánh Sáng Của Ai Cập',
      'Cực Tốc Phát Đại Tài',
      'Bảng Phong Thần',
      'Ngôi Sao Bữa Tiệc',
      'Đêm Party',
      'Nightfall Hunting'
    ],
    'fc': [
      'Của Cải Dồi Dào',
      'Cuối Năm',
      'Cuối Năm 2',
      'Dạo Chơi Phố Đêm',
      'Tây Bộ Phong Vân',
      'Ông Trùm Phú Quý',
      'Rùa Thỏ Đua Xe',
      'Tầm Bảo Biển Lớn',
      'Bạo Kích Đường Mật',
      'Vũ Trụ Đại Chiến',
      'Bính Bính Hổ',
      'Cá Chép Tiền Tài',
      'Robin Hood',
      'Ba Con Heo Nhỏ',
      'Bí Bảo Cổ Mộ',
      'Báo Kim Tiền',
      'Money Tree Dozer',
      'Cánh Buồm Tầm Bảo',
      'Tiệc Lẩu',
      'Đậu Ma',
      'Sự Giàu Có Trong Quyền Anh',
      'CHILIHUAHUA',
      'Năm Mới Lộ Lộ Phát',
      'Circus Dozer',
      'Trâu Hoang Điên Cuồng',
      'Đại Nhạc Môn',
      'Kho Báu Ai Cập',
      'FA CHAI Dozer',
      'Trứng Vàng',
      'Nữ Thần Vệ Đà',
      'Pháo Rồng Tài Lộc',
      'Thần Tài Phi Dương',
      'Tranh Đấu La Mã',
      'Kim Linh Thần Đèn',
      'Kiếm Tiền Vui',
      'Đoạt Bảo Vui Nhộn',
      'Huyền Thoại Của Inca',
      'LIGHTNING BOMB',
      'Của Cải Dồi Dào 3x3',
      'Báo Kim Tiền Xa Hoa',
      'Ma Thuật Ghép',
      'Cao Thủ Quét Mìn'
    ],
    'jdb': [
      'Ngôi Nhà Của Các Vị Thần',
      'Bandit Megaways',
      'Wild Rồng Hổ',
      'Supper Bull Cao Cấp',
      'Supper Bull',
      'Tiệc Chim Chóc',
      'Bạch Phú Mỹ',
      'Hoa Nở Phú Quý',
      'Vàng Của Người Maya',
      'Bất Tụ Bảo',
      'King Kong',
      'Phú Hào',
      'Phú Hào 2',
      'Hổ Tài Lộc',
      'Mùa Rồng',
      'Đèn Lồng Tài Lộc',
      'Kho Báu May Mắn',
      'Voi Tài Lộc',
      'Cá Chép Vượt Long Môn',
      'Búa Thần Sấm',
      'Sóng Nước 2',
      'Siêu Kim Cương',
      'Vương Quốc Chuối',
      'Giang Sơn Và Mỹ Nhân',
      'Ông Trùm Bia',
      'Đại Tam Nguyên',
      'Tỷ Phú',
      'Chim Bay Thú Chạy',
      'Party Chim',
      'Kho Báu Bò Tót',
      'Caishen Coming',
      'Caishen Party',
      'Mario',
      'Nông Trại CooCoo',
      'Dice'
    ],
    'pragmatic': [
      'Anh Hùng Rồng',
      'Bình Ma Thuật',
      'Kho báu của DaVinci',
      'Hoàng đế kỳ cựu',
      'Chú bò đen',
      'Samurai trỗi dậy 4',
      'Chuyến Tàu Seoul',
      'Sugar Rush 1000',
      'Vận May Ngọt Ngào',
      'Công Chúa Ánh Sáng 1000',
      'Công chúa ánh sáng',
      'Resurrecting Riches',
      'Năm mới May mắn',
      'Tia Chớp May Mắn',
      'Jackpot Hunter',
      'Các Vị Thần Hy Lạp',
      'Tê Giác Khổng Lồ',
      'Vận may của Giza',
      'Con rồng may mắn',
      'Ai Cập Phồn Vinh',
      'Zeus vs Hades - Vị Thần Chiến Tranh',
      'Gates of Olympus Xmas 1000',
      'Gates of Olympus Super Scatter',
      'Cánh Cổng Olympus',
      'Xúc Xắc Gates Of Olympus',
      'Cổng Olympus 1000',
      'Sự Trỗi Dậy Của Samurai',
      'Samurai Code',
      'Ác Quỷ 13',
      'Kim Cương Của Ai Cập',
      'Candy Corner',
      'Vua Trâu',
      'Săn vàng',
      'Cuốn Sách Các Cát Vàng',
      'Book of the Fallen'
    ],
    'topplayer': [
      'Kim Cương 100X 7',
      'Sư Tử Vàng Bách Phúc',
      'Kim Cương 10x 7',
      'Sư Tử Vàng Thập Toàn',
      'Kim Cương 5x 7',
      'Tiền Đầu Tay 777',
      'Thuật Giả Kim',
      'Liên Minh 2',
      'Liên Minh',
      'Chúc Mọi Điều Tốt Đẹp',
      'Luôn Phát',
      'Chiến Thần Zeus',
      'Aztec 777',
      'Aztec Báu',
      'Khỉ Con 2',
      'Khỉ Con',
      'Kẻ Cướp Ngân Hàng',
      'Vương Giả Quyết Chiến',
      'Bò Hoang Dã',
      'Bứt Phá',
      'Candy Pop',
      'Tiệc Kẹo Ngọt',
      'Kho Báu Gia Truyền',
      'Kho Báu Của Thuyền Trưởng',
      'Cơn Sốt Tiền Mặt',
      'Sức Mạnh Đồng Tiền',
      'Nữ Hoàng Ai Cập',
      'Cuồng 777',
      'Cuồng 888',
      'Người Pha Chế Điên Rồ',
      'Cuồng Rồng',
      'Nhảy Samba',
      'Tiệc Ngọt',
      'Tiệc Kim Cương',
      'Truyền Thuyết Khủng Long',
      'Kỳ Nghỉ Của Cún',
      'Rồng 8',
      'Ngọc Rồng',
      'Vàng Rồng',
      'Vua Rồng',
      'Rồng Thám Hiểm Kho Báu 1',
      'Rồng Thám Hiểm Kho Báu 2'
    ],
    '168game': [
      'Ù Mạt Chược 1',
      'Ù Mạt Chược 2',
      'Siêu Thú Ace',
      'Sư Phụ Wada Chế Độ Tốc Độ Cao',
      'Sư Phụ Wada 2',
      'Thật Sảng Khoái 2',
      'Thật Sảng Khoái 3',
      'Thật Sảng Khoái',
      'Heo Disco',
      'Siêu Sạc Dự Phòng',
      'Sư Phụ Wada'
    ],
    'cq9': [
      'Vận Mệnh Tốt M',
      'Đêm Nhạc Disco M',
      'Trò Chơi Fa Cai Shen 2',
      'Nhảy Cao 2',
      'Nhảy Cao',
      'Cây Hái Ra Tiền',
      'Aladdin & Cây Đèn Thần',
      'Vận Mệnh Tốt',
      '5 Linh Vật',
      'Nhảy Cao Di Động',
      'Thần Sấm',
      'Nữ Hoàng Lửa 2',
      'Thần Hercules',
      'Trò Chơi Fa Cai Shen',
      'Đêm Nhạc Disco',
      'Ngọc Rồng',
      'Sáu Viên Kẹo',
      'Thần Tài 888',
      'Thần Thoại Hy Lạp',
      'Sexy Bunny Girl',
      '5 Trận Chiến',
      '6 Bò Đức',
      '777',
      'Apollo',
      'Apsaras',
      'Bóng Chày Cuồng Nhiệt',
      'Hắc Ngộ Không',
      'Chameleon',
      'Chicago II',
      'Thật Sảng Khoái 3',
      'Cơn Sốt Bóng Chày',
      'Đại Phát Tài',
      'Đại Hồng Trung',
      'Heo Nhảy Disco',
      'Fa Cai Fu Wa',
      'Trò Chơi Fa Cai Shen M',
      'Nữ Hoàng Lửa',
      'Chợ Nổi Trái Cây',
      'Pháo Đài Hoa',
      'Thần Tài Bay',
      'Bóng Đá Cuồng Nhiệt',
      'Bóng Đá Cuồng Nhiệt M'
    ],
    'turbo': [
      'Mìn Một Chạm',
      'Không Khí',
      'Bóng Đôi',
      'Bayraktar',
      'Sách Mìn',
      'Bong Bóng',
      'Va Chạm X Phiên Bản Bóng Đôi',
      'Va Chạm X',
      'Cricket Boom',
      'Poker Pha Lê',
      'Xúc Xắc Ba',
      'Xúc Xắc Đôi',
      'Phố Chó',
      'Vai Donny',
      'Xúc Xắc Tiếp',
      'Thủ Lĩnh Nhanh',
      'Tháp Trái Cây',
      'Cầu Thang Cuồng Nộ',
      'Hamster',
      'Cao Thấp',
      'Lao X',
      'Nhấp Vào Đá Quý',
      'Kỵ Sĩ Giới Hạn',
      'Keno Ma Thuật',
      'Dò Mìn',
      'Mìn Đa Người Chơi',
      'Mèo',
      'Gấu Trúc Báo',
      'Bơm X',
      'Những Chiến Nhẫn Của Olympus',
      'Cứu Công Chúa',
      'Tấn Công Xoay',
      'Lấy Plinko Của Tôi',
      'Tháp',
      'Xúc Xắc Giao Dịch',
      'Mìn Turbo',
      'Plinko Turbo',
      'Xoay Nước',
      'Phá Cột Gôn'
    ],
    'microgaming': [
      'Tiền Của Caishen',
      'Lễ Hội Carnaval',
      'Vô Hạn Vàng',
      'Kho Báu Odin',
      'Thỏ May Mắn',
      'Ngọn Lửa Sói Chiến',
      'Người Phụ Nữ Bất Tử',
      'Ngọn Lửa Kim Cương',
      'Candy Rush Wilds',
      'Bầu Vật Cổ Đại Zeus',
      'Song Nhi Thịnh Vượng',
      'Tiền Đạo Bóng Đá',
      'Song Nhi',
      '10 000 Lời Ước Nguyện',
      'Kim Đồng Ngọc Nữ',
      'Chiến Thắng Lửa Vạn Năng',
      'Bứt Phá Tối Đa',
      'Pong Pong Mahjong',
      'Almighty Zeus Wilds',
      '108 Vị Anh Hùng',
      'Thủy Hử Mới',
      '25000 Talons',
      '15 Đinh Ba',
      'Super 777',
      'Châu Phi X Up',
      'Thần Tài Kim Cổ',
      'Đế Chế Thần Biển Poseidon',
      'Amazing Pharaoh',
      'Amazon Ngự Trị',
      'Cái Lưỡi Cày Và Quặng',
      'Lặn Thú',
      'Mảnh Rồng'
    ]
  };
  
  // Cập nhật title
  const providerInfo = providers[provider] || providers['pg'];
  document.getElementById('pageTitle').textContent = providerInfo.displayName;
  
  // Lấy danh sách game của provider hiện tại
  const currentGames = providerGames[provider] || providerGames['pg'];
  
  // Tạo games grid
  const gamesGrid = document.getElementById('gamesGrid');
  
  if (!gamesGrid) {
    console.error('ERROR: gamesGrid not found!');
    return;
  }
  
  for (let i = 0; i < currentGames.length; i++) {
    const gameName = currentGames[i];
    const hasHotBadge = i % 7 === 0;
    const hasNewBadge = i % 5 === 0 && !hasHotBadge;
    
    const gameCard = document.createElement('div');
    gameCard.className = 'game-card';
    gameCard.innerHTML = `
      <div class="game-image">
        <div class="game-image-inner">
          <img alt="${gameName}" class="game-img">
          <div class="game-overlay"></div>
          ${hasHotBadge ? '<span class="hot-badge">5,000x</span>' : ''}
          ${hasNewBadge ? '<span class="new-badge">✨ MỚI</span>' : ''}
        </div>
      </div>
      <div class="game-info">
        <h3 class="game-name">${gameName}</h3>
      </div>
    `;
    gamesGrid.appendChild(gameCard);
    
    // Load ảnh với fallback qua nhiều format
    const img = gameCard.querySelector('.game-img');
    tryLoadImage(img, gameName, provider);
  }
  
  // Search functionality
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    const gameCards = document.querySelectorAll('.game-card');
    
    gameCards.forEach(card => {
      const gameName = card.querySelector('.game-name').textContent.toLowerCase();
      if (gameName.includes(searchTerm)) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
  });
  
  // Random button - Mở game ngẫu nhiên
  document.querySelector('.random-btn').addEventListener('click', function() {
    // Kiểm tra xu trước khi random
    const currentUser = getCurrentUser();
    if (!currentUser) {
      showNotification('Vui lòng đăng nhập lại!', 'error');
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
      return;
    }
    
    const userBalance = currentUser.balance || currentUser.xu || 0;
    
    // Nếu hết xu thì hiển thị popup cảnh báo
    if (userBalance === 0) {
      showWarningPopup(userBalance, 10);
      return;
    }
    
    const gameCards = Array.from(document.querySelectorAll('.game-card'));
    if (gameCards.length === 0) return;
    
    const randomCard = gameCards[Math.floor(Math.random() * gameCards.length)];
    const gameName = randomCard.querySelector('.game-name').textContent;
    const gameImg = randomCard.querySelector('.game-img').src;
    
    // Scroll đến game được chọn
    randomCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Hiệu ứng nhấp nháy
    randomCard.style.transform = 'scale(1.15)';
    randomCard.style.boxShadow = '0 0 30px rgba(59, 130, 246, 0.8)';
    
    setTimeout(() => {
      randomCard.style.transform = '';
      randomCard.style.boxShadow = '';
      
      // Vào game trực tiếp KHÔNG TRỪ XU
      showLoadingPopup();
      setTimeout(() => {
        hideLoadingPopup();
        showGameDetailModal(gameName, gameImg);
      }, 500);
    }, 800);
  });
  
  // Play button handler - Kiểm tra xu trước khi vào game
  gamesGrid.addEventListener('click', function(e) {
    // Tìm game card gần nhất
    let gameCard = e.target;
    
    // Tìm đến khi gặp .game-card hoặc gamesGrid
    while (gameCard && gameCard !== gamesGrid) {
      if (gameCard.classList && gameCard.classList.contains('game-card')) {
        break;
      }
      gameCard = gameCard.parentElement;
    }
    
    // Nếu không tìm thấy game-card, return
    if (!gameCard || gameCard === gamesGrid) {
      return;
    }
    
    const gameName = gameCard.querySelector('.game-name').textContent;
    const gameImg = gameCard.querySelector('.game-img').src;
    
    // Kiểm tra số xu của user
    const currentUser = getCurrentUser();
    if (!currentUser) {
      showNotification('Vui lòng đăng nhập lại!', 'error');
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
      return;
    }
    
    const userBalance = currentUser.balance || currentUser.xu || 0;
    
    // Vào game trực tiếp KHÔNG TRỪ XU - chỉ trừ xu khi phân tích
    showLoadingPopup();
    setTimeout(() => {
      hideLoadingPopup();
      showGameDetailModal(gameName, gameImg);
    }, 500);
  });
  
  // Lấy thông tin user hiện tại
  function getCurrentUser() {
    const userStr = localStorage.getItem('current_user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('❌ Error parsing user data:', error);
      return null;
    }
  }
  
  // Trừ xu và vào game
  async function deductXuAndEnterGame(gameName, gameImg, xuAmount) {
    const authToken = localStorage.getItem('auth_token');
    if (!authToken) {
      showNotification('Vui lòng đăng nhập lại!', 'error');
      return;
    }
    
    try {
      console.log('🎮 Attempting to deduct xu and enter game:', gameName);
      
      // Gọi API để trừ xu trên server
      const response = await fetch('/api/user/deduct-xu', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount: xuAmount })
      });
      
      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Xu deducted successfully:', data);
        
        // Cập nhật số xu mới từ server
        const newBalance = data.newBalance || data.balance;
        updateLocalBalance(newBalance);
        
        // KHÔNG hiển thị thông báo trừ xu - tự động vào game
        
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Failed to deduct xu:', errorData);
        // Không hiển thị lỗi, vẫn cho vào game
      }
      
      // Vào game ngay lập tức
      showLoadingPopup();
      setTimeout(() => {
        hideLoadingPopup();
        showGameDetailModal(gameName, gameImg);
      }, 500);
      
    } catch (error) {
      console.error('❌ Failed to deduct xu:', error);
      // Không hiển thị lỗi, vẫn cho vào game
      
      // Vào game ngay lập tức
      showLoadingPopup();
      setTimeout(() => {
        hideLoadingPopup();
        showGameDetailModal(gameName, gameImg);
      }, 500);
    }
  }
  
  // Cập nhật balance local
  function updateLocalBalance(newBalance) {
    const currentUser = getCurrentUser();
    if (currentUser) {
      currentUser.balance = newBalance;
      currentUser.xu = newBalance;
      localStorage.setItem('current_user', JSON.stringify(currentUser));
    }
    
    // Cập nhật UI
    const balanceEl = document.getElementById('balanceAmount');
    if (balanceEl) {
      balanceEl.textContent = newBalance.toLocaleString();
      
      // Animation
      balanceEl.style.transform = 'scale(1.2)';
      balanceEl.style.color = '#ef4444'; // Màu đỏ khi trừ
      setTimeout(() => {
        balanceEl.style.transform = 'scale(1)';
        balanceEl.style.color = '';
      }, 500);
    }
  }
  
  // Reset tất cả dữ liệu phân tích
  function resetGameAnalysisData() {
    // Reset input về 0
    const pointInput = document.getElementById('pointInput');
    if (pointInput) {
      pointInput.value = '0';
    }
    
    // Reset % về 0%
    const percentageValue = document.querySelector('.percentage-value');
    if (percentageValue) {
      percentageValue.textContent = '0%';
    }
    
    // Reset QUAY MỚI
    const quayMoiSubtitle = document.getElementById('quayMoiSubtitle');
    if (quayMoiSubtitle) {
      quayMoiSubtitle.textContent = '0 vòng - Mức Tối Thiểu 0K';
    }
    
    // Reset QUAY AUTO
    const quayAutoSubtitle = document.getElementById('quayAutoSubtitle');
    if (quayAutoSubtitle) {
      quayAutoSubtitle.textContent = '0 vòng - Mức Tối Thiểu 0K';
    }
    
    // Reset KHUNG GIỜ
    const khungGioSubtitle = document.getElementById('khungGioSubtitle');
    if (khungGioSubtitle) {
      khungGioSubtitle.textContent = ': Chưa có dữ liệu :';
    }
    
    console.log('🔄 Reset tất cả dữ liệu phân tích');
  }
  
  // Show game detail modal
  function showGameDetailModal(gameName, gameImg) {
    const modal = document.getElementById('gameDetailModal');
    
    if (!modal) {
      console.error('Modal not found!');
      return;
    }
    
    const modalGameImage = document.getElementById('modalGameImage');
    const modalGameTitle = document.getElementById('modalGameTitle');
    const providerAvatar = document.getElementById('providerAvatar');
    
    // Set game info
    if (modalGameTitle) {
      modalGameTitle.textContent = gameName.length > 20 ? gameName.substring(0, 17) + '...' : gameName;
    }
    if (modalGameImage) {
      modalGameImage.src = gameImg || '';
    }
    
    // Set provider avatar based on current provider
    if (providerAvatar) {
      const urlParams = new URLSearchParams(window.location.search);
      const provider = urlParams.get('provider') || 'pg';
      
      // Map provider names to avatar filenames
      const providerAvatarMap = {
        'pg': 'pg.webp',
        'jili': 'jili.webp',
        'fc': 'fc.webp',
        'jdb': 'jdb.webp',
        'pragmatic': 'pragmatic-play.webp',
        'topplayer': 'top-player.webp',
        '168game': '168game.webp',
        'cq9': 'cq9.webp',
        'turbo': 'turbo-games.webp',
        'microgaming': 'microgaming.webp'
      };
      
      const avatarFile = providerAvatarMap[provider] || 'pg.webp';
      providerAvatar.src = `assets/img/providers/${avatarFile}`;
      providerAvatar.alt = provider.toUpperCase();
      
      console.log('🎮 Provider avatar loaded:', avatarFile);
    }
    
    // Setup point input listener
    setupPointInputListener();
    
    // RESET DỮ LIỆU KHI MỞ MODAL
    resetGameAnalysisData();
    
    // Reset flag phân tích
    window.hasAnalyzed = false;
    
    // Show modal
    modal.classList.add('show');
    
    // TẮT particles animation để tối ưu hiệu suất
    // if (window.modalParticlesController) {
    //   window.modalParticlesController.start();
    // }
    
    // Scroll to top of modal
    modal.scrollTop = 0;
    window.scrollTo(0, 0);
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }
  
  // Show loading popup
  function showLoadingPopup() {
    // Create loading popup if not exists
    let loadingPopup = document.getElementById('loadingPopup');
    if (!loadingPopup) {
      loadingPopup = document.createElement('div');
      loadingPopup.id = 'loadingPopup';
      loadingPopup.innerHTML = `
        <div class="loading-content">
          <div class="loading-spinner"></div>
          <div class="loading-text">Đang tải...</div>
        </div>
      `;
      document.body.appendChild(loadingPopup);
    }
    loadingPopup.classList.add('show');
  }
  
  // Hide loading popup
  function hideLoadingPopup() {
    const loadingPopup = document.getElementById('loadingPopup');
    if (loadingPopup) {
      loadingPopup.classList.remove('show');
    }
  }
  
  // Close modal handler
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const gameDetailModal = document.getElementById('gameDetailModal');
  
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeGameDetailModal);
  }
  
  // Close modal when clicking outside
  if (gameDetailModal) {
    gameDetailModal.addEventListener('click', function(e) {
      if (e.target === gameDetailModal) {
        closeGameDetailModal();
      }
    });
  }
  
  // Close modal function
  async function closeGameDetailModal() {
    // TRỪ XU KHI ĐÓNG MODAL (nếu đã phân tích)
    if (window.hasAnalyzed) {
      await deductXuForAnalysis();
      window.hasAnalyzed = false; // Reset flag
    }
    
    // Xóa class activated khỏi các nút
    const btnQuayMoi = document.getElementById('btnQuayMoi');
    const btnQuayAuto = document.getElementById('btnQuayAuto');
    const btnKhungGio = document.getElementById('btnKhungGio');
    [btnQuayMoi, btnQuayAuto, btnKhungGio].forEach(btn => {
      if (btn) btn.classList.remove('btn-activated');
    });
    
    // Reset button và input phân tích
    const btnAnalysis = document.getElementById('btnAnalysis');
    const pointInput = document.getElementById('pointInput');
    if (btnAnalysis) {
      btnAnalysis.style.opacity = '1';
      btnAnalysis.style.cursor = 'pointer';
    }
    if (pointInput) {
      pointInput.disabled = false;
    }
    window.isAnalyzing = false;
    
    const modal = document.getElementById('gameDetailModal');
    modal.classList.remove('show');
    document.body.style.overflow = '';
    
    // Stop particles animation
    if (window.modalParticlesController) {
      window.modalParticlesController.stop();
    }
    
    // RESET TẤT CẢ DỮ LIỆU KHI ĐÓNG MODAL
    resetGameAnalysisData();
  }
  
  // ESC key to close modal
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeGameDetailModal();
    }
  });
  
  // Setup point input listener
  function setupPointInputListener() {
    const pointInput = document.getElementById('pointInput');
    const quayMoiSubtitle = document.getElementById('quayMoiSubtitle');
    const quayAutoSubtitle = document.getElementById('quayAutoSubtitle');
    const khungGioSubtitle = document.getElementById('khungGioSubtitle');
    
    if (!pointInput) return;
    
    // KHÔNG CẬP NHẬT GÌ KHI NHẬP SỐ - chỉ khi bấm phân tích
  }
  
  // Kích hoạt hiệu ứng sáng cho các nút action sau khi phân tích
  function activateActionButtons() {
    const btnQuayMoi = document.getElementById('btnQuayMoi');
    const btnQuayAuto = document.getElementById('btnQuayAuto');
    const btnKhungGio = document.getElementById('btnKhungGio');
    
    // Thêm class active vào các nút
    [btnQuayMoi, btnQuayAuto, btnKhungGio].forEach((btn, index) => {
      if (btn) {
        setTimeout(() => {
          btn.classList.add('btn-activated');
          
          // Tạo hiệu ứng glow pulse
          btn.style.animation = 'btnGlowPulse 1.5s ease-in-out';
          
          setTimeout(() => {
            btn.style.animation = '';
          }, 1500);
        }, index * 150); // Delay mỗi nút 150ms
      }
    });
  }
  
  // Dữ liệu cơ bản cho từng game
  const gameDataMap = {
    'Rồng Vàng Tặng Bảo': { baseQuayMoi: 23, baseQuayAuto: 50, minQuayMoi: '7K', minQuayAuto: '6K', minutesAdd: 10, basePercentage: 88 },
    'Thần May Mắn': { baseQuayMoi: 20, baseQuayAuto: 46, minQuayMoi: '3K', minQuayAuto: '5K', minutesAdd: 10, basePercentage: 67 },
    'Chú Chuột May Mắn': { baseQuayMoi: 28, baseQuayAuto: 45, minQuayMoi: '3K', minQuayAuto: '5K', minutesAdd: 11, basePercentage: 72 },
    'Chú Bò May Mắn': { baseQuayMoi: 35, baseQuayAuto: 52, minQuayMoi: '3K', minQuayAuto: '5K', minutesAdd: 13, basePercentage: 92 },
    'Thỏ May Mắn (PG)': { baseQuayMoi: 30, baseQuayAuto: 48, minQuayMoi: '3K', minQuayAuto: '5K', minutesAdd: 13, basePercentage: 93 },
    'Kho Báu Aztec': { baseQuayMoi: 24, baseQuayAuto: 38, minQuayMoi: '3K', minQuayAuto: '5K', minutesAdd: 11, basePercentage: 80 },
    'Đường Mạt Chược 2': { baseQuayMoi: 30, baseQuayAuto: 48, minQuayMoi: '3K', minQuayAuto: '5K', minutesAdd: 15, basePercentage: 79 },
    'Đường Mạt Chược': { baseQuayMoi: 20, baseQuayAuto: 53, minQuayMoi: '3K', minQuayAuto: '5K', minutesAdd: 11, basePercentage: 89 },
    'Kì Lân Mách Nước': { baseQuayMoi: 27, baseQuayAuto: 44, minQuayMoi: '3K', minQuayAuto: '4K', minutesAdd: 12, basePercentage: 95 },
    'Chiến Thắng Caishen': { baseQuayMoi: 34, baseQuayAuto: 36, minQuayMoi: '6K', minQuayAuto: '5K', minutesAdd: 11, basePercentage: 88 },
    'Hổ May Mắn': { baseQuayMoi: 16, baseQuayAuto: 53, minQuayMoi: '59K', minQuayAuto: '46K', minutesAdd: 11, basePercentage: 95 },
    'Neko May Mắn': { baseQuayMoi: 24, baseQuayAuto: 48, minQuayMoi: '3K', minQuayAuto: '2K', minutesAdd: 15, basePercentage: 99 },
    'Vàng Giả Kim': { baseQuayMoi: 18, baseQuayAuto: 40, minQuayMoi: '6K', minQuayAuto: '2K', minutesAdd: 14, basePercentage: 94 },
    'Cơn Thịnh Nộ Của Anubis': { baseQuayMoi: 35, baseQuayAuto: 54, minQuayMoi: '8K', minQuayAuto: '5K', minutesAdd: 14, basePercentage: 98 },
    'Asgard Trỗi Dậy': { baseQuayMoi: 15, baseQuayAuto: 55, minQuayMoi: '8K', minQuayAuto: '5K', minutesAdd: 13, basePercentage: 91 },
    'Tiệm Bánh Phát Đạt': { baseQuayMoi: 26, baseQuayAuto: 49, minQuayMoi: '6K', minQuayAuto: '4K', minutesAdd: 12, basePercentage: 82 },
    'Kỳ Nghỉ Bali': { baseQuayMoi: 20, baseQuayAuto: 41, minQuayMoi: '7K', minQuayAuto: '7K', minutesAdd: 14, basePercentage: 83 },
    'Cuộc Chiến Hoàng Gia': { baseQuayMoi: 21, baseQuayAuto: 35, minQuayMoi: '12K', minQuayAuto: '11K', minutesAdd: 14, basePercentage: 77 },
    'Ngưu Đại Chiến': { baseQuayMoi: 29, baseQuayAuto: 41, minQuayMoi: '7K', minQuayAuto: '4K', minutesAdd: 14, basePercentage: 67 },
    'Hoa Bướm': { baseQuayMoi: 23, baseQuayAuto: 39, minQuayMoi: '2K', minQuayAuto: '5K', minutesAdd: 14, basePercentage: 75 },
    'Kho Báu Của Thuyền Trưởng (PG)': { baseQuayMoi: 26, baseQuayAuto: 39, minQuayMoi: '3K', minQuayAuto: '4K', minutesAdd: 14, basePercentage: 67 },
    'Chicky Run': { baseQuayMoi: 21, baseQuayAuto: 36, minQuayMoi: '4K', minQuayAuto: '6K', minutesAdd: 14, basePercentage: 69 },
    'Rạp Xiếc Nhiệm Màu': { baseQuayMoi: 18, baseQuayAuto: 50, minQuayMoi: '7K', minQuayAuto: '4K', minutesAdd: 15, basePercentage: 70 },
    'Đêm Cocktail': { baseQuayMoi: 18, baseQuayAuto: 35, minQuayMoi: '4K', minQuayAuto: '3K', minutesAdd: 12, basePercentage: 83 },
    'Kẹo Ngọt Bùng Nổ': { baseQuayMoi: 16, baseQuayAuto: 53, minQuayMoi: '5K', minQuayAuto: '2K', minutesAdd: 15, basePercentage: 86 },
    'Kẹo Bonanza': { baseQuayMoi: 15, baseQuayAuto: 46, minQuayMoi: '3K', minQuayAuto: '5K', minutesAdd: 14, basePercentage: 92 },
    'Thiên Đường Bikini': { baseQuayMoi: 25, baseQuayAuto: 36, minQuayMoi: '8K', minQuayAuto: '6K', minutesAdd: 13, basePercentage: 95 },
    'Cơn Sốt Tiền': { baseQuayMoi: 21, baseQuayAuto: 51, minQuayMoi: '6K', minQuayAuto: '5K', minutesAdd: 13, basePercentage: 80 },
    'Socola Cao Cấp': { baseQuayMoi: 25, baseQuayAuto: 43, minQuayMoi: '3K', minQuayAuto: '8K', minutesAdd: 14, basePercentage: 74 },
    'Du Thuyền Hoàng Gia': { baseQuayMoi: 32, baseQuayAuto: 52, minQuayMoi: '3K', minQuayAuto: '6K', minutesAdd: 14, basePercentage: 81 },
    'Kripto Altin': { baseQuayMoi: 26, baseQuayAuto: 43, minQuayMoi: '3K', minQuayAuto: '4K', minutesAdd: 11, basePercentage: 83 },
    'Kho Báu Người Chết': { baseQuayMoi: 23, baseQuayAuto: 52, minQuayMoi: '3K', minQuayAuto: '5K', minutesAdd: 14, basePercentage: 89 },
    'Định Mệnh Của Mặt Trăng Và Mặt Trời': { baseQuayMoi: 15, baseQuayAuto: 36, minQuayMoi: '5K', minQuayAuto: '2K', minutesAdd: 13, basePercentage: 86 },
    'Bữa Tối Hân Hoan': { baseQuayMoi: 25, baseQuayAuto: 49, minQuayMoi: '5K', minQuayAuto: '7K', minutesAdd: 11, basePercentage: 91 },
    'Vòng Quay Cơn Sốt Quán Ăn': { baseQuayMoi: 16, baseQuayAuto: 44, minQuayMoi: '4K', minQuayAuto: '2K', minutesAdd: 10, basePercentage: 72 },
    'Cuồng Nộ Ngày Tận Thế': { baseQuayMoi: 32, baseQuayAuto: 53, minQuayMoi: '8K', minQuayAuto: '2K', minutesAdd: 11, basePercentage: 95 },
    'Kho Báu Khổng Lồ': { baseQuayMoi: 25, baseQuayAuto: 40, minQuayMoi: '7K', minQuayAuto: '4K', minutesAdd: 14, basePercentage: 88 },
    'Tìm Rồng - Khám Bảo Vật 2': { baseQuayMoi: 25, baseQuayAuto: 38, minQuayMoi: '2K', minQuayAuto: '5K', minutesAdd: 10, basePercentage: 59 },
    'Truyền Thuyết Rồng': { baseQuayMoi: 33, baseQuayAuto: 40, minQuayMoi: '4K', minQuayAuto: '8K', minutesAdd: 15, basePercentage: 94 },
    'Rồng Hổ May Mắn': { baseQuayMoi: 20, baseQuayAuto: 37, minQuayMoi: '6K', minQuayAuto: '4K', minutesAdd: 10, basePercentage: 90 },
    'Quyết Chiến Giành Tiền Thưởng': { baseQuayMoi: 15, baseQuayAuto: 43, minQuayMoi: '2K', minQuayAuto: '16K', minutesAdd: 5, basePercentage: 89 },
    'Siêu Cấp Ace': { baseQuayMoi: 17, baseQuayAuto: 39, minQuayMoi: '3K', minQuayAuto: '7K', minutesAdd: 15, basePercentage: 85 },
    'Quyền Vương': { baseQuayMoi: 16, baseQuayAuto: 42, minQuayMoi: '9K', minQuayAuto: '2K', minutesAdd: 13, basePercentage: 96 },
    'Baby Kẹo Ngọt': { baseQuayMoi: 18, baseQuayAuto: 52, minQuayMoi: '4K', minQuayAuto: '15K', minutesAdd: 12, basePercentage: 80 },
    'Nữ Thần Tế Aztec': { baseQuayMoi: 20, baseQuayAuto: 47, minQuayMoi: '3K', minQuayAuto: '7K', minutesAdd: 14, basePercentage: 89 },
    'Bảo Thạch Kala': { baseQuayMoi: 24, baseQuayAuto: 40, minQuayMoi: '19K', minQuayAuto: '14K', minutesAdd: 15, basePercentage: 88 },
    'Thần Long Đoạt Bảo': { baseQuayMoi: 29, baseQuayAuto: 43, minQuayMoi: '3K', minQuayAuto: '6K', minutesAdd: 11, basePercentage: 82 },
    '10 Sparkling Crown': { baseQuayMoi: 35, baseQuayAuto: 52, minQuayMoi: '7K', minQuayAuto: '5K', minutesAdd: 10, basePercentage: 98 },
    '3 Trâu Sạc': { baseQuayMoi: 33, baseQuayAuto: 43, minQuayMoi: '4K', minQuayAuto: '6K', minutesAdd: 10, basePercentage: 85 },
    '3 Kho Báu Đồng Xu 2': { baseQuayMoi: 25, baseQuayAuto: 36, minQuayMoi: '6K', minQuayAuto: '4K', minutesAdd: 10, basePercentage: 84 },
    '3 Kho Báu Đồng Xu': { baseQuayMoi: 22, baseQuayAuto: 39, minQuayMoi: '2K', minQuayAuto: '1K', minutesAdd: 15, basePercentage: 90 },
    'Ali Baba': { baseQuayMoi: 25, baseQuayAuto: 45, minQuayMoi: '2K', minQuayAuto: '7K', minutesAdd: 11, basePercentage: 87 },
    'Chiến Binh Đấu Trường': { baseQuayMoi: 16, baseQuayAuto: 46, minQuayMoi: '3K', minQuayAuto: '4K', minutesAdd: 14, basePercentage: 81 },
    'Bao Thanh Thiên': { baseQuayMoi: 19, baseQuayAuto: 43, minQuayMoi: '6K', minQuayAuto: '10K', minutesAdd: 12, basePercentage: 92 },
    'Tháng Khánh Điển': { baseQuayMoi: 29, baseQuayAuto: 51, minQuayMoi: '7K', minQuayAuto: '6K', minutesAdd: 12, basePercentage: 84 },
    'Thợ Săn Tiền Thưởng': { baseQuayMoi: 30, baseQuayAuto: 49, minQuayMoi: '9K', minQuayAuto: '6K', minutesAdd: 14, basePercentage: 85 },
    'Quyển Sách Hoàng Kim': { baseQuayMoi: 23, baseQuayAuto: 39, minQuayMoi: '3K', minQuayAuto: '4K', minutesAdd: 11, basePercentage: 93 },
    'Nàng Tiên Cá Ngọt Ngào': { baseQuayMoi: 23, baseQuayAuto: 35, minQuayMoi: '19K', minQuayAuto: '3K', minutesAdd: 15, basePercentage: 79 },
    'Tính Phí Buffalo Ascent': { baseQuayMoi: 25, baseQuayAuto: 55, minQuayMoi: '2K', minQuayAuto: '7K', minutesAdd: 14, basePercentage: 85 },
    'Trâu Rừng Xung Phong': { baseQuayMoi: 16, baseQuayAuto: 45, minQuayMoi: '10K', minQuayAuto: '6K', minutesAdd: 10, basePercentage: 58 },
    'Truyền Thuyết Tần Vương': { baseQuayMoi: 16, baseQuayAuto: 41, minQuayMoi: '9K', minQuayAuto: '9K', minutesAdd: 12, basePercentage: 95 },
    'Vô Cực Xu': { baseQuayMoi: 17, baseQuayAuto: 53, minQuayMoi: '6K', minQuayAuto: '1K', minutesAdd: 14, basePercentage: 88 },
    'Cây Tiền': { baseQuayMoi: 28, baseQuayAuto: 54, minQuayMoi: '7K', minQuayAuto: '8K', minutesAdd: 10, basePercentage: 93 },
    'Điên Cuồng 777': { baseQuayMoi: 34, baseQuayAuto: 40, minQuayMoi: '9K', minQuayAuto: '7K', minutesAdd: 10, basePercentage: 66 },
    'Điên Cuồng Phát Đại Tài': { baseQuayMoi: 18, baseQuayAuto: 41, minQuayMoi: '3K', minQuayAuto: '10K', minutesAdd: 10, basePercentage: 91 },
    'Crazy Pusher': { baseQuayMoi: 15, baseQuayAuto: 41, minQuayMoi: '17K', minQuayAuto: '7K', minutesAdd: 13, basePercentage: 69 },
    'Cricket King 18': { baseQuayMoi: 19, baseQuayAuto: 40, minQuayMoi: '5K', minQuayAuto: '6K', minutesAdd: 12, basePercentage: 88 },
    'Cricket Sah 75': { baseQuayMoi: 23, baseQuayAuto: 38, minQuayMoi: '20K', minQuayAuto: '7K', minutesAdd: 10, basePercentage: 68 },
    'Crystal 777 Cao Cấp': { baseQuayMoi: 29, baseQuayAuto: 41, minQuayMoi: '11K', minQuayAuto: '2K', minutesAdd: 11, basePercentage: 53 },
    'Dabanggg': { baseQuayMoi: 15, baseQuayAuto: 49, minQuayMoi: '2K', minQuayAuto: '12K', minutesAdd: 12, basePercentage: 94 },
    'Lửa Quỷ 2': { baseQuayMoi: 34, baseQuayAuto: 38, minQuayMoi: '4K', minQuayAuto: '1K', minutesAdd: 10, basePercentage: 82 },
    'Lửa Quỷ': { baseQuayMoi: 18, baseQuayAuto: 47, minQuayMoi: '10K', minQuayAuto: '10K', minutesAdd: 15, basePercentage: 64 },
    'Buổi Tiệc Đá Quý': { baseQuayMoi: 27, baseQuayAuto: 41, minQuayMoi: '20K', minQuayAuto: '17K', minutesAdd: 10, basePercentage: 72 },
    'Ánh Sáng Của Ai Cập': { baseQuayMoi: 15, baseQuayAuto: 39, minQuayMoi: '16K', minQuayAuto: '2K', minutesAdd: 12, basePercentage: 87 },
    'Cực Tốc Phát Đại Tài': { baseQuayMoi: 17, baseQuayAuto: 44, minQuayMoi: '9K', minQuayAuto: '11K', minutesAdd: 14, basePercentage: 74 },
    'Bảng Phong Thần': { baseQuayMoi: 31, baseQuayAuto: 42, minQuayMoi: '8K', minQuayAuto: '10K', minutesAdd: 15, basePercentage: 69 },
    'Ngôi Sao Bữa Tiệc': { baseQuayMoi: 25, baseQuayAuto: 46, minQuayMoi: '4K', minQuayAuto: '3K', minutesAdd: 11, basePercentage: 95 },
    'Đêm Party': { baseQuayMoi: 23, baseQuayAuto: 38, minQuayMoi: '39K', minQuayAuto: '54K', minutesAdd: 11, basePercentage: 72 },
    'Nightfall Hunting': { baseQuayMoi: 18, baseQuayAuto: 47, minQuayMoi: '3K', minQuayAuto: '22K', minutesAdd: 14, basePercentage: 71 },
    
    // ========== FC GAMES (46 GAMES) ==========
    'Của Cải Dồi Dào': { baseQuayMoi: 32, baseQuayAuto: 54, minQuayMoi: '2K', minQuayAuto: '2K', minutesAdd: 12, basePercentage: 65 },
    'Cuối Năm': { baseQuayMoi: 31, baseQuayAuto: 50, minQuayMoi: '10K', minQuayAuto: '9K', minutesAdd: 12, basePercentage: 77 },
    'Cuối Năm 2': { baseQuayMoi: 19, baseQuayAuto: 45, minQuayMoi: '8K', minQuayAuto: '2K', minutesAdd: 15, basePercentage: 95 },
    'Dạo Chơi Phố Đêm': { baseQuayMoi: 35, baseQuayAuto: 37, minQuayMoi: '6K', minQuayAuto: '7K', minutesAdd: 12, basePercentage: 97 },
    'Tây Bộ Phong Vân': { baseQuayMoi: 22, baseQuayAuto: 40, minQuayMoi: '5K', minQuayAuto: '1K', minutesAdd: 13, basePercentage: 82 },
    'Ông Trùm Phú Quý': { baseQuayMoi: 15, baseQuayAuto: 51, minQuayMoi: '12K', minQuayAuto: '3K', minutesAdd: 14, basePercentage: 96 },
    'Rùa Thỏ Đua Xe': { baseQuayMoi: 35, baseQuayAuto: 47, minQuayMoi: '1K', minQuayAuto: '6K', minutesAdd: 12, basePercentage: 68 },
    'Tầm Bảo Biển Lớn': { baseQuayMoi: 19, baseQuayAuto: 54, minQuayMoi: '2K', minQuayAuto: '3K', minutesAdd: 10, basePercentage: 69 },
    'Bạo Kích Đường Mật': { baseQuayMoi: 18, baseQuayAuto: 47, minQuayMoi: '5K', minQuayAuto: '5K', minutesAdd: 11, basePercentage: 72 },
    'Vũ Trụ Đại Chiến': { baseQuayMoi: 18, baseQuayAuto: 53, minQuayMoi: '2K', minQuayAuto: '5K', minutesAdd: 10, basePercentage: 68 },
    'Bính Bính Hổ': { baseQuayMoi: 20, baseQuayAuto: 47, minQuayMoi: '3K', minQuayAuto: '6K', minutesAdd: 15, basePercentage: 72 },
    'Cá Chép Tiền Tài': { baseQuayMoi: 20, baseQuayAuto: 42, minQuayMoi: '1K', minQuayAuto: '6K', minutesAdd: 14, basePercentage: 80 },
    'Robin Hood': { baseQuayMoi: 15, baseQuayAuto: 50, minQuayMoi: '4K', minQuayAuto: '1K', minutesAdd: 11, basePercentage: 87 },
    'Ba Con Heo Nhỏ': { baseQuayMoi: 28, baseQuayAuto: 39, minQuayMoi: '5K', minQuayAuto: '4K', minutesAdd: 15, basePercentage: 69 },
    'Bí Bảo Cổ Mộ': { baseQuayMoi: 24, baseQuayAuto: 40, minQuayMoi: '4K', minQuayAuto: '5K', minutesAdd: 14, basePercentage: 94 },
    'Báo Kim Tiền': { baseQuayMoi: 21, baseQuayAuto: 42, minQuayMoi: '1K', minQuayAuto: '1K', minutesAdd: 15, basePercentage: 93 },
    'Money Tree Dozer': { baseQuayMoi: 22, baseQuayAuto: 44, minQuayMoi: '4K', minQuayAuto: '3K', minutesAdd: 12, basePercentage: 65 },
    'Căng Buồm Tầm Bảo': { baseQuayMoi: 28, baseQuayAuto: 45, minQuayMoi: '2K', minQuayAuto: '8K', minutesAdd: 10, basePercentage: 77 },
    'Tiệc Lẩu': { baseQuayMoi: 30, baseQuayAuto: 44, minQuayMoi: '7K', minQuayAuto: '5K', minutesAdd: 10, basePercentage: 82 },
    'Đậu Ma': { baseQuayMoi: 26, baseQuayAuto: 47, minQuayMoi: '4K', minQuayAuto: '3K', minutesAdd: 10, basePercentage: 82 },
    'Sự Giàu Có Trong Quyền Anh': { baseQuayMoi: 33, baseQuayAuto: 52, minQuayMoi: '6K', minQuayAuto: '6K', minutesAdd: 12, basePercentage: 76 },
    'Chilihuahua': { baseQuayMoi: 21, baseQuayAuto: 41, minQuayMoi: '6K', minQuayAuto: '7K', minutesAdd: 14, basePercentage: 90 },
    'Năm Mới Lộ Lộ Phát': { baseQuayMoi: 22, baseQuayAuto: 47, minQuayMoi: '4K', minQuayAuto: '3K', minutesAdd: 10, basePercentage: 87 },
    'Circus Dozer': { baseQuayMoi: 26, baseQuayAuto: 37, minQuayMoi: '2K', minQuayAuto: '3K', minutesAdd: 14, basePercentage: 96 },
    'Trâu Hoang Điên Cuồng': { baseQuayMoi: 34, baseQuayAuto: 46, minQuayMoi: '5K', minQuayAuto: '2K', minutesAdd: 15, basePercentage: 78 },
    'Đại Nhạc Môn': { baseQuayMoi: 21, baseQuayAuto: 45, minQuayMoi: '2K', minQuayAuto: '3K', minutesAdd: 13, basePercentage: 75 },
    'Kho Báu Ai Cập': { baseQuayMoi: 24, baseQuayAuto: 42, minQuayMoi: '6K', minQuayAuto: '2K', minutesAdd: 13, basePercentage: 71 },
    'FA Chai Dozer': { baseQuayMoi: 29, baseQuayAuto: 47, minQuayMoi: '5K', minQuayAuto: '3K', minutesAdd: 15, basePercentage: 89 },
    'Trứng Vàng': { baseQuayMoi: 17, baseQuayAuto: 36, minQuayMoi: '3K', minQuayAuto: '2K', minutesAdd: 12, basePercentage: 76 },
    'Nữ Thần Vệ Đà': { baseQuayMoi: 35, baseQuayAuto: 43, minQuayMoi: '2K', minQuayAuto: '9K', minutesAdd: 14, basePercentage: 79 },
    'Pháo Rồng Tài Lộc': { baseQuayMoi: 23, baseQuayAuto: 47, minQuayMoi: '1K', minQuayAuto: '2K', minutesAdd: 11, basePercentage: 78 },
    'Thần Tài Phi Dương': { baseQuayMoi: 16, baseQuayAuto: 41, minQuayMoi: '66K', minQuayAuto: '26K', minutesAdd: 15, basePercentage: 77 },
    'Tranh Đấu La Mã': { baseQuayMoi: 16, baseQuayAuto: 35, minQuayMoi: '31K', minQuayAuto: '78K', minutesAdd: 11, basePercentage: 99 },
    'Kim Linh Thần Đèn': { baseQuayMoi: 19, baseQuayAuto: 52, minQuayMoi: '6K', minQuayAuto: '7K', minutesAdd: 14, basePercentage: 69 },
    'Kiếm Tiền Vui': { baseQuayMoi: 33, baseQuayAuto: 37, minQuayMoi: '3K', minQuayAuto: '2K', minutesAdd: 15, basePercentage: 85 },
    'Đoạt Bảo Vui Nhộn': { baseQuayMoi: 34, baseQuayAuto: 49, minQuayMoi: '1K', minQuayAuto: '2K', minutesAdd: 15, basePercentage: 97 },
    'Huyền Thoại Của Inca': { baseQuayMoi: 35, baseQuayAuto: 45, minQuayMoi: '4K', minQuayAuto: '3K', minutesAdd: 10, basePercentage: 75 },
    'Lightning Bomb': { baseQuayMoi: 29, baseQuayAuto: 54, minQuayMoi: '4K', minQuayAuto: '8K', minutesAdd: 14, basePercentage: 87 },
    'Của Cải Dồi Dào 3x3': { baseQuayMoi: 30, baseQuayAuto: 49, minQuayMoi: '4K', minQuayAuto: '6K', minutesAdd: 15, basePercentage: 97 },
    'Báo Kim Tiền Xa Hoa': { baseQuayMoi: 27, baseQuayAuto: 47, minQuayMoi: '4K', minQuayAuto: '1K', minutesAdd: 13, basePercentage: 77 },
    'Ma Thuật Ghép': { baseQuayMoi: 22, baseQuayAuto: 52, minQuayMoi: '1K', minQuayAuto: '3K', minutesAdd: 10, basePercentage: 77 },
    'Cao Thủ Quét Mìn': { baseQuayMoi: 27, baseQuayAuto: 35, minQuayMoi: '3K', minQuayAuto: '2K', minutesAdd: 11, basePercentage: 63 },
    
    // ========== JDB GAMES (36 GAMES) ==========
    'Ngôi Nhà Của Các Vị Thần': { baseQuayMoi: 28, baseQuayAuto: 42, minQuayMoi: '3K', minQuayAuto: '1K', minutesAdd: 11, basePercentage: 69 },
    'Bandit Megaways': { baseQuayMoi: 32, baseQuayAuto: 44, minQuayMoi: '3K', minQuayAuto: '5K', minutesAdd: 12, basePercentage: 93 },
    'Wild Rồng Hổ': { baseQuayMoi: 31, baseQuayAuto: 47, minQuayMoi: '2K', minQuayAuto: '2K', minutesAdd: 13, basePercentage: 91 },
    'Supper Bull Cao Cấp': { baseQuayMoi: 19, baseQuayAuto: 43, minQuayMoi: '12K', minQuayAuto: '17K', minutesAdd: 15, basePercentage: 81 },
    'Supper Bull': { baseQuayMoi: 23, baseQuayAuto: 35, minQuayMoi: '5K', minQuayAuto: '2K', minutesAdd: 14, basePercentage: 100 },
    'Tiệc Chim Chóc': { baseQuayMoi: 22, baseQuayAuto: 41, minQuayMoi: '3K', minQuayAuto: '4K', minutesAdd: 14, basePercentage: 75 },
    'Bạch Phú Mỹ': { baseQuayMoi: 32, baseQuayAuto: 53, minQuayMoi: '1K', minQuayAuto: '3K', minutesAdd: 11, basePercentage: 97 },
    'Hoa Nở Phú Quý': { baseQuayMoi: 28, baseQuayAuto: 44, minQuayMoi: '4K', minQuayAuto: '4K', minutesAdd: 10, basePercentage: 92 },
    'Vàng Của Người Maya': { baseQuayMoi: 31, baseQuayAuto: 38, minQuayMoi: '5K', minQuayAuto: '4K', minutesAdd: 13, basePercentage: 91 },
    'Bất Tụ Bảo': { baseQuayMoi: 16, baseQuayAuto: 53, minQuayMoi: '1K', minQuayAuto: '4K', minutesAdd: 10, basePercentage: 95 },
    'King Kong': { baseQuayMoi: 19, baseQuayAuto: 48, minQuayMoi: '2K', minQuayAuto: '6K', minutesAdd: 12, basePercentage: 91 },
    'Phú Hào': { baseQuayMoi: 32, baseQuayAuto: 51, minQuayMoi: '2K', minQuayAuto: '2K', minutesAdd: 14, basePercentage: 68 },
    'Phú Hào 2': { baseQuayMoi: 28, baseQuayAuto: 41, minQuayMoi: '3K', minQuayAuto: '3K', minutesAdd: 14, basePercentage: 69 },
    'Hổ Tài Lộc': { baseQuayMoi: 27, baseQuayAuto: 44, minQuayMoi: '4K', minQuayAuto: '4K', minutesAdd: 13, basePercentage: 66 },
    'Mùa Rồng': { baseQuayMoi: 27, baseQuayAuto: 36, minQuayMoi: '2K', minQuayAuto: '5K', minutesAdd: 14, basePercentage: 87 },
    'Đèn Lồng Tài Lộc': { baseQuayMoi: 29, baseQuayAuto: 51, minQuayMoi: '4K', minQuayAuto: '1K', minutesAdd: 12, basePercentage: 92 },
    'Kho Báu May Mắn': { baseQuayMoi: 17, baseQuayAuto: 45, minQuayMoi: '5K', minQuayAuto: '2K', minutesAdd: 11, basePercentage: 70 },
    'Voi Tài Lộc': { baseQuayMoi: 24, baseQuayAuto: 41, minQuayMoi: '3K', minQuayAuto: '5K', minutesAdd: 12, basePercentage: 78 },
    'Cá Chép Vượt Long Môn': { baseQuayMoi: 19, baseQuayAuto: 55, minQuayMoi: '4K', minQuayAuto: '3K', minutesAdd: 10, basePercentage: 81 },
    'Búa Thần Sấm': { baseQuayMoi: 30, baseQuayAuto: 54, minQuayMoi: '1K', minQuayAuto: '4K', minutesAdd: 16, basePercentage: 85 },
    'Sóng Nước 2': { baseQuayMoi: 31, baseQuayAuto: 39, minQuayMoi: '2K', minQuayAuto: '12K', minutesAdd: 11, basePercentage: 58 },
    'Siêu Kim Cương': { baseQuayMoi: 34, baseQuayAuto: 55, minQuayMoi: '3K', minQuayAuto: '2K', minutesAdd: 11, basePercentage: 96 },
    'Vương Quốc Chuối': { baseQuayMoi: 15, baseQuayAuto: 35, minQuayMoi: '3K', minQuayAuto: '4K', minutesAdd: 14, basePercentage: 69 },
    'Giang Sơn Và Mỹ Nhân': { baseQuayMoi: 25, baseQuayAuto: 48, minQuayMoi: '1K', minQuayAuto: '1K', minutesAdd: 12, basePercentage: 65 },
    'Ông Trùm Bia': { baseQuayMoi: 27, baseQuayAuto: 37, minQuayMoi: '2K', minQuayAuto: '1K', minutesAdd: 15, basePercentage: 95 },
    'Đại Tam Nguyên': { baseQuayMoi: 26, baseQuayAuto: 53, minQuayMoi: '4K', minQuayAuto: '5K', minutesAdd: 13, basePercentage: 89 },
    'Tỷ Phú': { baseQuayMoi: 27, baseQuayAuto: 40, minQuayMoi: '3K', minQuayAuto: '5K', minutesAdd: 13, basePercentage: 89 },
    'Chim Bay Thú Chạy': { baseQuayMoi: 35, baseQuayAuto: 35, minQuayMoi: '2K', minQuayAuto: '4K', minutesAdd: 15, basePercentage: 95 },
    'Party Chim': { baseQuayMoi: 19, baseQuayAuto: 39, minQuayMoi: '1K', minQuayAuto: '2K', minutesAdd: 14, basePercentage: 89 },
    'Kho Báu Bò Tót': { baseQuayMoi: 26, baseQuayAuto: 52, minQuayMoi: '2K', minQuayAuto: '3K', minutesAdd: 12, basePercentage: 90 },
    'Caishen Coming': { baseQuayMoi: 19, baseQuayAuto: 41, minQuayMoi: '4K', minQuayAuto: '3K', minutesAdd: 15, basePercentage: 58 },
    'Caishen Party': { baseQuayMoi: 28, baseQuayAuto: 47, minQuayMoi: '2K', minQuayAuto: '2K', minutesAdd: 10, basePercentage: 71 },
    'Mario': { baseQuayMoi: 28, baseQuayAuto: 49, minQuayMoi: '3K', minQuayAuto: '2K', minutesAdd: 10, basePercentage: 71 },
    'Nông Trại Coocoo': { baseQuayMoi: 26, baseQuayAuto: 48, minQuayMoi: '4K', minQuayAuto: '4K', minutesAdd: 11, basePercentage: 93 },
    'Dice': { baseQuayMoi: 15, baseQuayAuto: 46, minQuayMoi: '2K', minQuayAuto: '3K', minutesAdd: 15, basePercentage: 78 },
    
    // ========== PRAGMATIC PLAY GAMES (35 GAMES) ==========
    'Anh Hùng Rồng': { baseQuayMoi: 16, baseQuayAuto: 45, minQuayMoi: '1K', minQuayAuto: '2K', minutesAdd: 10, basePercentage: 85 },
    'Bình Ma Thuật': { baseQuayMoi: 24, baseQuayAuto: 35, minQuayMoi: '3K', minQuayAuto: '1K', minutesAdd: 12, basePercentage: 98 },
    'Kho Báu Của Davinci': { baseQuayMoi: 17, baseQuayAuto: 51, minQuayMoi: '3K', minQuayAuto: '4K', minutesAdd: 10, basePercentage: 84 },
    'Hoàng Đế Kỳ Cựu': { baseQuayMoi: 28, baseQuayAuto: 46, minQuayMoi: '4K', minQuayAuto: '4K', minutesAdd: 12, basePercentage: 85 },
    'Chú Bò Đen': { baseQuayMoi: 27, baseQuayAuto: 43, minQuayMoi: '4K', minQuayAuto: '3K', minutesAdd: 15, basePercentage: 87 },
    'Samurai Trỗi Dậy 4': { baseQuayMoi: 25, baseQuayAuto: 41, minQuayMoi: '1K', minQuayAuto: '3K', minutesAdd: 10, basePercentage: 81 },
    'Chuyến Tàu Seoul': { baseQuayMoi: 31, baseQuayAuto: 46, minQuayMoi: '2K', minQuayAuto: '2K', minutesAdd: 11, basePercentage: 90 },
    'Sugar Rush 1000': { baseQuayMoi: 35, baseQuayAuto: 35, minQuayMoi: '2K', minQuayAuto: '2K', minutesAdd: 15, basePercentage: 79 },
    'Vận May Ngọt Ngào': { baseQuayMoi: 16, baseQuayAuto: 44, minQuayMoi: '2K', minQuayAuto: '2K', minutesAdd: 12, basePercentage: 85 },
    'Công Chúa Ánh Sáng 1000': { baseQuayMoi: 31, baseQuayAuto: 48, minQuayMoi: '6K', minQuayAuto: '4K', minutesAdd: 15, basePercentage: 94 },
    'Công Chúa Ánh Sáng': { baseQuayMoi: 19, baseQuayAuto: 50, minQuayMoi: '2K', minQuayAuto: '4K', minutesAdd: 13, basePercentage: 77 },
    'Resurrecting Riches': { baseQuayMoi: 34, baseQuayAuto: 44, minQuayMoi: '3K', minQuayAuto: '5K', minutesAdd: 11, basePercentage: 84 },
    'Năm Mới May Mắn': { baseQuayMoi: 33, baseQuayAuto: 55, minQuayMoi: '3K', minQuayAuto: '3K', minutesAdd: 11, basePercentage: 90 },
    'Tia Chớp May Mắn': { baseQuayMoi: 18, baseQuayAuto: 54, minQuayMoi: '3K', minQuayAuto: '4K', minutesAdd: 12, basePercentage: 78 },
    'Jackpot Hunter': { baseQuayMoi: 22, baseQuayAuto: 44, minQuayMoi: '4K', minQuayAuto: '3K', minutesAdd: 13, basePercentage: 94 },
    'Các Vị Thần Hy Lạp': { baseQuayMoi: 25, baseQuayAuto: 41, minQuayMoi: '2K', minQuayAuto: '1K', minutesAdd: 11, basePercentage: 77 },
    'Tê Giác Khổng Lồ': { baseQuayMoi: 25, baseQuayAuto: 35, minQuayMoi: '2K', minQuayAuto: '5K', minutesAdd: 14, basePercentage: 79 },
    'Vận May Của Giza': { baseQuayMoi: 25, baseQuayAuto: 36, minQuayMoi: '3K', minQuayAuto: '5K', minutesAdd: 12, basePercentage: 95 },
    'Con Rồng May Mắn': { baseQuayMoi: 31, baseQuayAuto: 54, minQuayMoi: '1K', minQuayAuto: '2K', minutesAdd: 11, basePercentage: 91 },
    'Ai Cập Phồn Vinh': { baseQuayMoi: 16, baseQuayAuto: 54, minQuayMoi: '3K', minQuayAuto: '3K', minutesAdd: 10, basePercentage: 94 },
    'Zeus Và Hades Vị Thần Chiến Tranh': { baseQuayMoi: 25, baseQuayAuto: 43, minQuayMoi: '9K', minQuayAuto: '4K', minutesAdd: 13, basePercentage: 93 },
    'Gate Of Olympus Xmas 1000': { baseQuayMoi: 32, baseQuayAuto: 52, minQuayMoi: '6K', minQuayAuto: '3K', minutesAdd: 11, basePercentage: 94 },
    'Gate Of Olympus Super Scatter': { baseQuayMoi: 26, baseQuayAuto: 48, minQuayMoi: '3K', minQuayAuto: '1K', minutesAdd: 10, basePercentage: 80 },
    'Cánh Cổng Olympus': { baseQuayMoi: 25, baseQuayAuto: 54, minQuayMoi: '4K', minQuayAuto: '6K', minutesAdd: 11, basePercentage: 88 },
    'Xúc Xắc Gate Of Olympus': { baseQuayMoi: 32, baseQuayAuto: 39, minQuayMoi: '1K', minQuayAuto: '5K', minutesAdd: 13, basePercentage: 85 },
    'Cổng Olympus 1000': { baseQuayMoi: 26, baseQuayAuto: 47, minQuayMoi: '4K', minQuayAuto: '3K', minutesAdd: 15, basePercentage: 88 },
    'Sự Trỗi Dậy Của Samurai': { baseQuayMoi: 16, baseQuayAuto: 53, minQuayMoi: '1K', minQuayAuto: '2K', minutesAdd: 15, basePercentage: 95 },
    'Samurai Code': { baseQuayMoi: 28, baseQuayAuto: 47, minQuayMoi: '1K', minQuayAuto: '10K', minutesAdd: 12, basePercentage: 98 },
    'Ác Quỷ 13': { baseQuayMoi: 19, baseQuayAuto: 49, minQuayMoi: '6K', minQuayAuto: '2K', minutesAdd: 11, basePercentage: 87 },
    'Kim Cương Của Ai Cập': { baseQuayMoi: 23, baseQuayAuto: 42, minQuayMoi: '1K', minQuayAuto: '2K', minutesAdd: 11, basePercentage: 96 },
    'Candy Corner': { baseQuayMoi: 21, baseQuayAuto: 47, minQuayMoi: '4K', minQuayAuto: '3K', minutesAdd: 11, basePercentage: 79 },
    'Vua Trâu': { baseQuayMoi: 31, baseQuayAuto: 44, minQuayMoi: '2K', minQuayAuto: '3K', minutesAdd: 13, basePercentage: 80 },
    'Săn Vàng': { baseQuayMoi: 22, baseQuayAuto: 55, minQuayMoi: '1K', minQuayAuto: '4K', minutesAdd: 13, basePercentage: 87 },
    'Cuốn Sách Các Cát': { baseQuayMoi: 20, baseQuayAuto: 41, minQuayMoi: '2K', minQuayAuto: '1K', minutesAdd: 15, basePercentage: 83 },
    'Book Of The Fallen': { baseQuayMoi: 33, baseQuayAuto: 55, minQuayMoi: '5K', minQuayAuto: '4K', minutesAdd: 10, basePercentage: 86 },
    
    // ========== TOP PLAYER GAMES (42 GAMES) ==========
    'Kim Cương 100X 7': { baseQuayMoi: 27, baseQuayAuto: 37, minQuayMoi: '1K', minQuayAuto: '4K', minutesAdd: 12, basePercentage: 100 },
    'Sư Tử Vàng Bách Phúc': { baseQuayMoi: 23, baseQuayAuto: 48, minQuayMoi: '2K', minQuayAuto: '3K', minutesAdd: 11, basePercentage: 57 },
    'Kim Cương 10x 7': { baseQuayMoi: 26, baseQuayAuto: 54, minQuayMoi: '2K', minQuayAuto: '3K', minutesAdd: 10, basePercentage: 56 },
    'Sư Tử Vàng Thập Toàn': { baseQuayMoi: 27, baseQuayAuto: 42, minQuayMoi: '2K', minQuayAuto: '3K', minutesAdd: 13, basePercentage: 67 },
    'Kim Cương 5x 7': { baseQuayMoi: 15, baseQuayAuto: 49, minQuayMoi: '2K', minQuayAuto: '1K', minutesAdd: 14, basePercentage: 65 },
    'Tiền Đầu Tay 777': { baseQuayMoi: 18, baseQuayAuto: 43, minQuayMoi: '3K', minQuayAuto: '2K', minutesAdd: 12, basePercentage: 72 },
    'Thuật Giả Kim': { baseQuayMoi: 24, baseQuayAuto: 51, minQuayMoi: '2K', minQuayAuto: '4K', minutesAdd: 11, basePercentage: 88 },
    'Liên Minh 2': { baseQuayMoi: 29, baseQuayAuto: 46, minQuayMoi: '3K', minQuayAuto: '3K', minutesAdd: 13, basePercentage: 81 },
    'Liên Minh': { baseQuayMoi: 21, baseQuayAuto: 39, minQuayMoi: '2K', minQuayAuto: '2K', minutesAdd: 14, basePercentage: 75 },
    'Chúc Mọi Điều Tốt Đẹp': { baseQuayMoi: 32, baseQuayAuto: 48, minQuayMoi: '1K', minQuayAuto: '3K', minutesAdd: 10, basePercentage: 92 },
    'Luôn Phát': { baseQuayMoi: 17, baseQuayAuto: 44, minQuayMoi: '2K', minQuayAuto: '1K', minutesAdd: 15, basePercentage: 86 },
    'Chiến Thần Zeus': { baseQuayMoi: 30, baseQuayAuto: 52, minQuayMoi: '4K', minQuayAuto: '5K', minutesAdd: 12, basePercentage: 94 },
    'Aztec 777': { baseQuayMoi: 19, baseQuayAuto: 41, minQuayMoi: '3K', minQuayAuto: '2K', minutesAdd: 11, basePercentage: 78 },
    'Aztec Báu': { baseQuayMoi: 28, baseQuayAuto: 50, minQuayMoi: '2K', minQuayAuto: '4K', minutesAdd: 13, basePercentage: 85 },
    'Khỉ Con 2': { baseQuayMoi: 20, baseQuayAuto: 38, minQuayMoi: '1K', minQuayAuto: '2K', minutesAdd: 14, basePercentage: 69 },
    'Khỉ Con': { baseQuayMoi: 16, baseQuayAuto: 42, minQuayMoi: '2K', minQuayAuto: '3K', minutesAdd: 12, basePercentage: 71 },
    'Kẻ Cướp Ngân Hàng': { baseQuayMoi: 25, baseQuayAuto: 47, minQuayMoi: '3K', minQuayAuto: '4K', minutesAdd: 11, basePercentage: 89 },
    'Vương Giả Quyết Chiến': { baseQuayMoi: 33, baseQuayAuto: 53, minQuayMoi: '5K', minQuayAuto: '6K', minutesAdd: 15, basePercentage: 96 },
    'Bò Hoang Dã': { baseQuayMoi: 22, baseQuayAuto: 45, minQuayMoi: '2K', minQuayAuto: '3K', minutesAdd: 13, basePercentage: 82 },
    'Bứt Phá': { baseQuayMoi: 26, baseQuayAuto: 49, minQuayMoi: '3K', minQuayAuto: '2K', minutesAdd: 10, basePercentage: 87 },
    'Candy Pop': { baseQuayMoi: 18, baseQuayAuto: 40, minQuayMoi: '1K', minQuayAuto: '2K', minutesAdd: 12, basePercentage: 74 },
    'Tiệc Kẹo Ngọt': { baseQuayMoi: 23, baseQuayAuto: 44, minQuayMoi: '2K', minQuayAuto: '3K', minutesAdd: 14, basePercentage: 80 },
    'Kho Báu Gia Truyền': { baseQuayMoi: 31, baseQuayAuto: 51, minQuayMoi: '4K', minQuayAuto: '5K', minutesAdd: 11, basePercentage: 91 },
    'Kho Báu Của Thuyền Trưởng': { baseQuayMoi: 19, baseQuayAuto: 43, minQuayMoi: '2K', minQuayAuto: '3K', minutesAdd: 13, basePercentage: 77 },
    'Cơn Sốt Tiền Mặt': { baseQuayMoi: 27, baseQuayAuto: 48, minQuayMoi: '3K', minQuayAuto: '4K', minutesAdd: 12, basePercentage: 88 },
    'Sức Mạnh Đồng Tiền': { baseQuayMoi: 24, baseQuayAuto: 46, minQuayMoi: '2K', minQuayAuto: '3K', minutesAdd: 15, basePercentage: 84 },
    'Nữ Hoàng Ai Cập': { baseQuayMoi: 29, baseQuayAuto: 52, minQuayMoi: '4K', minQuayAuto: '5K', minutesAdd: 11, basePercentage: 93 },
    'Cuồng 777': { baseQuayMoi: 21, baseQuayAuto: 39, minQuayMoi: '2K', minQuayAuto: '2K', minutesAdd: 10, basePercentage: 70 },
    'Cuồng 888': { baseQuayMoi: 20, baseQuayAuto: 41, minQuayMoi: '3K', minQuayAuto: '2K', minutesAdd: 14, basePercentage: 73 },
    'Người Pha Chế Điên Rồ': { baseQuayMoi: 17, baseQuayAuto: 37, minQuayMoi: '1K', minQuayAuto: '2K', minutesAdd: 12, basePercentage: 68 },
    'Cuồng Rồng': { baseQuayMoi: 34, baseQuayAuto: 54, minQuayMoi: '5K', minQuayAuto: '6K', minutesAdd: 13, basePercentage: 97 },
    'Nhảy Samba': { baseQuayMoi: 15, baseQuayAuto: 36, minQuayMoi: '1K', minQuayAuto: '2K', minutesAdd: 11, basePercentage: 66 },
    'Tiệc Ngọt': { baseQuayMoi: 22, baseQuayAuto: 42, minQuayMoi: '2K', minQuayAuto: '3K', minutesAdd: 15, basePercentage: 79 },
    'Tiệc Kim Cương': { baseQuayMoi: 30, baseQuayAuto: 50, minQuayMoi: '4K', minQuayAuto: '5K', minutesAdd: 12, basePercentage: 90 },
    'Truyền Thuyết Khủng Long': { baseQuayMoi: 25, baseQuayAuto: 47, minQuayMoi: '3K', minQuayAuto: '4K', minutesAdd: 14, basePercentage: 85 },
    'Kỳ Nghỉ Của Cún': { baseQuayMoi: 18, baseQuayAuto: 40, minQuayMoi: '2K', minQuayAuto: '2K', minutesAdd: 13, basePercentage: 72 },
    'Rồng 8': { baseQuayMoi: 28, baseQuayAuto: 49, minQuayMoi: '3K', minQuayAuto: '4K', minutesAdd: 11, basePercentage: 86 },
    'Ngọc Rồng (TOP PLAYER)': { baseQuayMoi: 26, baseQuayAuto: 45, minQuayMoi: '2K', minQuayAuto: '3K', minutesAdd: 10, basePercentage: 83 },
    'Vàng Rồng': { baseQuayMoi: 32, baseQuayAuto: 53, minQuayMoi: '4K', minQuayAuto: '5K', minutesAdd: 15, basePercentage: 95 },
    'Vua Rồng': { baseQuayMoi: 35, baseQuayAuto: 55, minQuayMoi: '5K', minQuayAuto: '6K', minutesAdd: 12, basePercentage: 98 },
    'Rồng Thám Hiểm Kho Báu 1': { baseQuayMoi: 23, baseQuayAuto: 44, minQuayMoi: '2K', minQuayAuto: '3K', minutesAdd: 13, basePercentage: 81 },
    'Rồng Thám Hiểm Kho Báu 2': { baseQuayMoi: 27, baseQuayAuto: 48, minQuayMoi: '3K', minQuayAuto: '4K', minutesAdd: 14, basePercentage: 87 },
    
    // ========== 168GAME GAMES (11 GAMES) ==========
    'Ù Mạt Chược 1': { baseQuayMoi: 19, baseQuayAuto: 42, minQuayMoi: '2K', minQuayAuto: '3K', minutesAdd: 11, basePercentage: 76 },
    'Ù Mạt Chược 2': { baseQuayMoi: 24, baseQuayAuto: 47, minQuayMoi: '3K', minQuayAuto: '4K', minutesAdd: 13, basePercentage: 82 },
    'Siêu Thú Ace': { baseQuayMoi: 31, baseQuayAuto: 51, minQuayMoi: '4K', minQuayAuto: '5K', minutesAdd: 12, basePercentage: 91 },
    'Sư Phụ Wada Chế Độ Tốc Độ Cao': { baseQuayMoi: 28, baseQuayAuto: 49, minQuayMoi: '3K', minQuayAuto: '4K', minutesAdd: 14, basePercentage: 88 },
    'Sư Phụ Wada 2': { baseQuayMoi: 22, baseQuayAuto: 44, minQuayMoi: '2K', minQuayAuto: '3K', minutesAdd: 10, basePercentage: 79 },
    'Thật Sảng Khoái 2': { baseQuayMoi: 26, baseQuayAuto: 46, minQuayMoi: '3K', minQuayAuto: '3K', minutesAdd: 15, basePercentage: 84 },
    'Thật Sảng Khoái 3 (168GAME)': { baseQuayMoi: 20, baseQuayAuto: 40, minQuayMoi: '2K', minQuayAuto: '2K', minutesAdd: 11, basePercentage: 73 },
    'Thật Sảng Khoái': { baseQuayMoi: 17, baseQuayAuto: 38, minQuayMoi: '1K', minQuayAuto: '2K', minutesAdd: 12, basePercentage: 68 },
    'Heo Disco': { baseQuayMoi: 15, baseQuayAuto: 35, minQuayMoi: '1K', minQuayAuto: '1K', minutesAdd: 13, basePercentage: 64 },
    'Siêu Sạc Dự Phòng': { baseQuayMoi: 33, baseQuayAuto: 53, minQuayMoi: '5K', minQuayAuto: '6K', minutesAdd: 14, basePercentage: 95 },
    'Sư Phụ Wada': { baseQuayMoi: 25, baseQuayAuto: 45, minQuayMoi: '3K', minQuayAuto: '3K', minutesAdd: 12, basePercentage: 81 },
    
    // ========== CQ9 GAMES (43 GAMES) ==========
    'Vận Mệnh Tốt M': { baseQuayMoi: 21, baseQuayAuto: 43, minQuayMoi: '2K', minQuayAuto: '3K', minutesAdd: 11, basePercentage: 77 },
    'Đêm Nhạc Disco M': { baseQuayMoi: 18, baseQuayAuto: 39, minQuayMoi: '2K', minQuayAuto: '2K', minutesAdd: 14, basePercentage: 71 },
    'Trò Chơi Fa Cai Shen 2': { baseQuayMoi: 29, baseQuayAuto: 50, minQuayMoi: '4K', minQuayAuto: '5K', minutesAdd: 13, basePercentage: 89 },
    'Nhảy Cao 2': { baseQuayMoi: 16, baseQuayAuto: 37, minQuayMoi: '1K', minQuayAuto: '2K', minutesAdd: 12, basePercentage: 66 },
    'Nhảy Cao': { baseQuayMoi: 15, baseQuayAuto: 36, minQuayMoi: '1K', minQuayAuto: '2K', minutesAdd: 10, basePercentage: 63 },
    'Cây Hái Ra Tiền': { baseQuayMoi: 27, baseQuayAuto: 48, minQuayMoi: '3K', minQuayAuto: '4K', minutesAdd: 15, basePercentage: 86 },
    'Aladdin & Cây Đèn Thần': { baseQuayMoi: 32, baseQuayAuto: 52, minQuayMoi: '5K', minQuayAuto: '6K', minutesAdd: 14, basePercentage: 93 },
    'Vận Mệnh Tốt': { baseQuayMoi: 20, baseQuayAuto: 42, minQuayMoi: '2K', minQuayAuto: '3K', minutesAdd: 11, basePercentage: 75 },
    '5 Linh Vật': { baseQuayMoi: 24, baseQuayAuto: 46, minQuayMoi: '3K', minQuayAuto: '4K', minutesAdd: 12, basePercentage: 82 },
    'Nhảy Cao Di Động': { baseQuayMoi: 17, baseQuayAuto: 38, minQuayMoi: '2K', minQuayAuto: '2K', minutesAdd: 13, basePercentage: 69 },
    'Thần Sấm': { baseQuayMoi: 30, baseQuayAuto: 51, minQuayMoi: '4K', minQuayAuto: '5K', minutesAdd: 15, basePercentage: 90 },
    'Nữ Hoàng Lửa 2': { baseQuayMoi: 26, baseQuayAuto: 47, minQuayMoi: '3K', minQuayAuto: '4K', minutesAdd: 11, basePercentage: 84 },
    'Thần Hercules': { baseQuayMoi: 34, baseQuayAuto: 54, minQuayMoi: '5K', minQuayAuto: '6K', minutesAdd: 14, basePercentage: 96 },
    'Trò Chơi Fa Cai Shen': { baseQuayMoi: 28, baseQuayAuto: 49, minQuayMoi: '4K', minQuayAuto: '4K', minutesAdd: 12, basePercentage: 87 },
    'Đêm Nhạc Disco': { baseQuayMoi: 19, baseQuayAuto: 40, minQuayMoi: '2K', minQuayAuto: '3K', minutesAdd: 13, basePercentage: 72 },
    'Ngọc Rồng (CQ9)': { baseQuayMoi: 31, baseQuayAuto: 52, minQuayMoi: '4K', minQuayAuto: '5K', minutesAdd: 15, basePercentage: 92 },
    'Sáu Viên Kẹo': { baseQuayMoi: 16, baseQuayAuto: 37, minQuayMoi: '1K', minQuayAuto: '2K', minutesAdd: 10, basePercentage: 65 },
    'Thần Tài 888': { baseQuayMoi: 35, baseQuayAuto: 55, minQuayMoi: '6K', minQuayAuto: '7K', minutesAdd: 14, basePercentage: 98 },
    'Thần Thoại Hy Lạp': { baseQuayMoi: 29, baseQuayAuto: 50, minQuayMoi: '4K', minQuayAuto: '5K', minutesAdd: 12, basePercentage: 88 },
    'Sexy Bunny Girl': { baseQuayMoi: 22, baseQuayAuto: 44, minQuayMoi: '3K', minQuayAuto: '3K', minutesAdd: 11, basePercentage: 78 },
    '5 Trận Chiến': { baseQuayMoi: 25, baseQuayAuto: 46, minQuayMoi: '3K', minQuayAuto: '4K', minutesAdd: 13, basePercentage: 83 },
    '6 Bò Đức': { baseQuayMoi: 18, baseQuayAuto: 39, minQuayMoi: '2K', minQuayAuto: '2K', minutesAdd: 14, basePercentage: 70 },
    '777': { baseQuayMoi: 23, baseQuayAuto: 45, minQuayMoi: '3K', minQuayAuto: '3K', minutesAdd: 10, basePercentage: 80 },
    'Apollo': { baseQuayMoi: 27, baseQuayAuto: 48, minQuayMoi: '3K', minQuayAuto: '4K', minutesAdd: 15, basePercentage: 85 },
    'Apsaras': { baseQuayMoi: 20, baseQuayAuto: 41, minQuayMoi: '2K', minQuayAuto: '3K', minutesAdd: 12, basePercentage: 74 },
    'Bóng Chày Cuồng Nhiệt': { baseQuayMoi: 24, baseQuayAuto: 47, minQuayMoi: '3K', minQuayAuto: '4K', minutesAdd: 11, basePercentage: 81 },
    'Hắc Ngộ Không': { baseQuayMoi: 33, baseQuayAuto: 53, minQuayMoi: '5K', minQuayAuto: '6K', minutesAdd: 14, basePercentage: 94 },
    'Chameleon': { baseQuayMoi: 17, baseQuayAuto: 38, minQuayMoi: '2K', minQuayAuto: '2K', minutesAdd: 13, basePercentage: 67 },
    'Chicago II': { baseQuayMoi: 26, baseQuayAuto: 46, minQuayMoi: '3K', minQuayAuto: '4K', minutesAdd: 12, basePercentage: 84 },
    'Thật Sảng Khoái 3 (CQ9)': { baseQuayMoi: 19, baseQuayAuto: 40, minQuayMoi: '2K', minQuayAuto: '3K', minutesAdd: 15, basePercentage: 72 },
    'Cơn Sốt Bóng Chày': { baseQuayMoi: 21, baseQuayAuto: 43, minQuayMoi: '2K', minQuayAuto: '3K', minutesAdd: 10, basePercentage: 76 },
    'Đại Phát Tài': { baseQuayMoi: 30, baseQuayAuto: 51, minQuayMoi: '4K', minQuayAuto: '5K', minutesAdd: 14, basePercentage: 91 },
    'Đại Hồng Trung': { baseQuayMoi: 28, baseQuayAuto: 49, minQuayMoi: '4K', minQuayAuto: '4K', minutesAdd: 13, basePercentage: 87 },
    'Heo Nhảy Disco': { baseQuayMoi: 16, baseQuayAuto: 36, minQuayMoi: '1K', minQuayAuto: '2K', minutesAdd: 11, basePercentage: 64 },
    'Fa Cai Fu Wa': { baseQuayMoi: 25, baseQuayAuto: 47, minQuayMoi: '3K', minQuayAuto: '4K', minutesAdd: 12, basePercentage: 83 },
    'Trò Chơi Fa Cai Shen M': { baseQuayMoi: 29, baseQuayAuto: 50, minQuayMoi: '4K', minQuayAuto: '5K', minutesAdd: 15, basePercentage: 89 },
    'Nữ Hoàng Lửa': { baseQuayMoi: 27, baseQuayAuto: 48, minQuayMoi: '3K', minQuayAuto: '4K', minutesAdd: 11, basePercentage: 85 },
    'Chợ Nổi Trái Cây': { baseQuayMoi: 18, baseQuayAuto: 39, minQuayMoi: '2K', minQuayAuto: '2K', minutesAdd: 14, basePercentage: 69 },
    'Pháo Đài Hoa': { baseQuayMoi: 22, baseQuayAuto: 44, minQuayMoi: '2K', minQuayAuto: '3K', minutesAdd: 13, basePercentage: 78 },
    'Thần Tài Bay': { baseQuayMoi: 32, baseQuayAuto: 52, minQuayMoi: '5K', minQuayAuto: '6K', minutesAdd: 12, basePercentage: 93 },
    'Bóng Đá Cuồng Nhiệt': { baseQuayMoi: 24, baseQuayAuto: 46, minQuayMoi: '3K', minQuayAuto: '4K', minutesAdd: 10, basePercentage: 82 },
    'Bóng Đá Cuồng Nhiệt M': { baseQuayMoi: 23, baseQuayAuto: 45, minQuayMoi: '3K', minQuayAuto: '3K', minutesAdd: 15, basePercentage: 80 },
    
    // ========== TURBO GAMES (39 GAMES) ==========
    'Mìn Một Chạm': { baseQuayMoi: 17, baseQuayAuto: 38, minQuayMoi: '2K', minQuayAuto: '2K', minutesAdd: 11, basePercentage: 68 },
    'Không Khí': { baseQuayMoi: 21, baseQuayAuto: 42, minQuayMoi: '2K', minQuayAuto: '3K', minutesAdd: 13, basePercentage: 75 },
    'Bóng Đôi': { baseQuayMoi: 19, baseQuayAuto: 40, minQuayMoi: '2K', minQuayAuto: '3K', minutesAdd: 12, basePercentage: 72 },
    'Bayraktar': { baseQuayMoi: 26, baseQuayAuto: 47, minQuayMoi: '3K', minQuayAuto: '4K', minutesAdd: 14, basePercentage: 84 },
    'Sách Mìn': { baseQuayMoi: 18, baseQuayAuto: 39, minQuayMoi: '2K', minQuayAuto: '2K', minutesAdd: 10, basePercentage: 70 },
    'Bong Bóng': { baseQuayMoi: 15, baseQuayAuto: 36, minQuayMoi: '1K', minQuayAuto: '2K', minutesAdd: 15, basePercentage: 63 },
    'Va Chạm X Phiên Bản Bóng Đôi': { baseQuayMoi: 24, baseQuayAuto: 46, minQuayMoi: '3K', minQuayAuto: '4K', minutesAdd: 13, basePercentage: 82 },
    'Va Chạm X': { baseQuayMoi: 22, baseQuayAuto: 44, minQuayMoi: '2K', minQuayAuto: '3K', minutesAdd: 11, basePercentage: 78 },
    'Cricket Boom': { baseQuayMoi: 28, baseQuayAuto: 49, minQuayMoi: '4K', minQuayAuto: '5K', minutesAdd: 14, basePercentage: 87 },
    'Poker Pha Lê': { baseQuayMoi: 30, baseQuayAuto: 51, minQuayMoi: '4K', minQuayAuto: '5K', minutesAdd: 12, basePercentage: 90 },
    'Xúc Xắc Ba': { baseQuayMoi: 20, baseQuayAuto: 41, minQuayMoi: '2K', minQuayAuto: '3K', minutesAdd: 15, basePercentage: 74 },
    'Xúc Xắc Đôi': { baseQuayMoi: 23, baseQuayAuto: 45, minQuayMoi: '3K', minQuayAuto: '3K', minutesAdd: 11, basePercentage: 80 },
    'Phố Chó': { baseQuayMoi: 16, baseQuayAuto: 37, minQuayMoi: '1K', minQuayAuto: '2K', minutesAdd: 13, basePercentage: 66 },
    'Vai Donny': { baseQuayMoi: 25, baseQuayAuto: 47, minQuayMoi: '3K', minQuayAuto: '4K', minutesAdd: 14, basePercentage: 83 },
    'Xúc Xắc Tiếp': { baseQuayMoi: 21, baseQuayAuto: 43, minQuayMoi: '2K', minQuayAuto: '3K', minutesAdd: 12, basePercentage: 76 },
    'Thủ Lĩnh Nhanh': { baseQuayMoi: 32, baseQuayAuto: 52, minQuayMoi: '5K', minQuayAuto: '6K', minutesAdd: 15, basePercentage: 93 },
    'Tháp Trái Cây': { baseQuayMoi: 18, baseQuayAuto: 39, minQuayMoi: '2K', minQuayAuto: '2K', minutesAdd: 10, basePercentage: 69 },
    'Cầu Thang Cuồng Nộ': { baseQuayMoi: 27, baseQuayAuto: 48, minQuayMoi: '3K', minQuayAuto: '4K', minutesAdd: 14, basePercentage: 86 },
    'Hamster': { baseQuayMoi: 15, baseQuayAuto: 35, minQuayMoi: '1K', minQuayAuto: '1K', minutesAdd: 11, basePercentage: 62 },
    'Cao Thấp': { baseQuayMoi: 19, baseQuayAuto: 40, minQuayMoi: '2K', minQuayAuto: '3K', minutesAdd: 13, basePercentage: 71 },
    'Lao X': { baseQuayMoi: 29, baseQuayAuto: 50, minQuayMoi: '4K', minQuayAuto: '5K', minutesAdd: 12, basePercentage: 88 },
    'Nhấp Vào Đá Quý': { baseQuayMoi: 22, baseQuayAuto: 44, minQuayMoi: '2K', minQuayAuto: '3K', minutesAdd: 15, basePercentage: 77 },
    'Kỵ Sĩ Giới Hạn': { baseQuayMoi: 31, baseQuayAuto: 51, minQuayMoi: '4K', minQuayAuto: '5K', minutesAdd: 14, basePercentage: 91 },
    'Keno Ma Thuật': { baseQuayMoi: 24, baseQuayAuto: 46, minQuayMoi: '3K', minQuayAuto: '4K', minutesAdd: 11, basePercentage: 81 },
    'Dò Mìn': { baseQuayMoi: 17, baseQuayAuto: 38, minQuayMoi: '2K', minQuayAuto: '2K', minutesAdd: 13, basePercentage: 67 },
    'Mìn Đa Người Chơi': { baseQuayMoi: 20, baseQuayAuto: 42, minQuayMoi: '2K', minQuayAuto: '3K', minutesAdd: 12, basePercentage: 73 },
    'Mèo': { baseQuayMoi: 16, baseQuayAuto: 36, minQuayMoi: '1K', minQuayAuto: '2K', minutesAdd: 10, basePercentage: 65 },
    'Gấu Trúc Báo': { baseQuayMoi: 26, baseQuayAuto: 47, minQuayMoi: '3K', minQuayAuto: '4K', minutesAdd: 15, basePercentage: 85 },
    'Bơm X': { baseQuayMoi: 23, baseQuayAuto: 45, minQuayMoi: '3K', minQuayAuto: '3K', minutesAdd: 14, basePercentage: 79 },
    'Những Chiến Nhẫn Của Olympus': { baseQuayMoi: 34, baseQuayAuto: 54, minQuayMoi: '5K', minQuayAuto: '6K', minutesAdd: 13, basePercentage: 96 },
    'Cứu Công Chúa': { baseQuayMoi: 28, baseQuayAuto: 49, minQuayMoi: '4K', minQuayAuto: '5K', minutesAdd: 11, basePercentage: 87 },
    'Tấn Công Xoay': { baseQuayMoi: 21, baseQuayAuto: 43, minQuayMoi: '2K', minQuayAuto: '3K', minutesAdd: 12, basePercentage: 75 },
    'Lấy Plinko Của Tôi': { baseQuayMoi: 19, baseQuayAuto: 41, minQuayMoi: '2K', minQuayAuto: '3K', minutesAdd: 15, basePercentage: 72 },
    'Tháp': { baseQuayMoi: 25, baseQuayAuto: 46, minQuayMoi: '3K', minQuayAuto: '4K', minutesAdd: 14, basePercentage: 83 },
    'Xúc Xắc Giao Dịch': { baseQuayMoi: 22, baseQuayAuto: 44, minQuayMoi: '2K', minQuayAuto: '3K', minutesAdd: 10, basePercentage: 78 },
    'Mìn Turbo': { baseQuayMoi: 18, baseQuayAuto: 39, minQuayMoi: '2K', minQuayAuto: '2K', minutesAdd: 13, basePercentage: 70 },
    'Plinko Turbo': { baseQuayMoi: 27, baseQuayAuto: 48, minQuayMoi: '3K', minQuayAuto: '4K', minutesAdd: 11, basePercentage: 86 },
    'Xoay Nước': { baseQuayMoi: 20, baseQuayAuto: 42, minQuayMoi: '2K', minQuayAuto: '3K', minutesAdd: 12, basePercentage: 74 },
    'Phá Cột Gôn': { baseQuayMoi: 24, baseQuayAuto: 45, minQuayMoi: '3K', minQuayAuto: '4K', minutesAdd: 15, basePercentage: 81 },
    
    // ========== MICROGAMING GAMES (32 GAMES) ==========
    'Tiền Của Caishen': { baseQuayMoi: 30, baseQuayAuto: 51, minQuayMoi: '4K', minQuayAuto: '5K', minutesAdd: 12, basePercentage: 90 },
    'Lễ Hội Carnaval': { baseQuayMoi: 19, baseQuayAuto: 40, minQuayMoi: '2K', minQuayAuto: '3K', minutesAdd: 14, basePercentage: 72 },
    'Vô Hạn Vàng': { baseQuayMoi: 33, baseQuayAuto: 53, minQuayMoi: '5K', minQuayAuto: '6K', minutesAdd: 15, basePercentage: 94 },
    'Kho Báu Odin': { baseQuayMoi: 28, baseQuayAuto: 49, minQuayMoi: '4K', minQuayAuto: '5K', minutesAdd: 13, basePercentage: 88 },
    'Thỏ May Mắn': { baseQuayMoi: 22, baseQuayAuto: 44, minQuayMoi: '2K', minQuayAuto: '3K', minutesAdd: 11, basePercentage: 78 },
    'Ngọn Lửa Sói Chiến': { baseQuayMoi: 27, baseQuayAuto: 48, minQuayMoi: '3K', minQuayAuto: '4K', minutesAdd: 14, basePercentage: 86 },
    'Người Phụ Nữ Bất Tử': { baseQuayMoi: 31, baseQuayAuto: 52, minQuayMoi: '4K', minQuayAuto: '5K', minutesAdd: 12, basePercentage: 92 },
    'Ngọn Lửa Kim Cương': { baseQuayMoi: 29, baseQuayAuto: 50, minQuayMoi: '4K', minQuayAuto: '5K', minutesAdd: 15, basePercentage: 89 },
    'Candy Rush Wilds': { baseQuayMoi: 18, baseQuayAuto: 39, minQuayMoi: '2K', minQuayAuto: '2K', minutesAdd: 10, basePercentage: 70 },
    'Bầu Vật Cổ Đại Zeus': { baseQuayMoi: 34, baseQuayAuto: 54, minQuayMoi: '5K', minQuayAuto: '6K', minutesAdd: 14, basePercentage: 96 },
    'Song Nhi Thịnh Vượng': { baseQuayMoi: 26, baseQuayAuto: 47, minQuayMoi: '3K', minQuayAuto: '4K', minutesAdd: 13, basePercentage: 84 },
    'Tiền Đạo Bóng Đá': { baseQuayMoi: 21, baseQuayAuto: 43, minQuayMoi: '2K', minQuayAuto: '3K', minutesAdd: 11, basePercentage: 76 },
    'Song Nhi': { baseQuayMoi: 25, baseQuayAuto: 46, minQuayMoi: '3K', minQuayAuto: '4K', minutesAdd: 12, basePercentage: 83 },
    '10 000 Lời Ước Nguyện': { baseQuayMoi: 32, baseQuayAuto: 52, minQuayMoi: '5K', minQuayAuto: '6K', minutesAdd: 15, basePercentage: 93 },
    'Kim Đồng Ngọc Nữ': { baseQuayMoi: 23, baseQuayAuto: 45, minQuayMoi: '3K', minQuayAuto: '3K', minutesAdd: 14, basePercentage: 80 },
    'Chiến Thắng Lửa Vạn Năng': { baseQuayMoi: 28, baseQuayAuto: 49, minQuayMoi: '4K', minQuayAuto: '5K', minutesAdd: 11, basePercentage: 87 },
    'Bứt Phá Tối Đa': { baseQuayMoi: 35, baseQuayAuto: 55, minQuayMoi: '6K', minQuayAuto: '7K', minutesAdd: 13, basePercentage: 98 },
    'Pong Pong Mahjong': { baseQuayMoi: 20, baseQuayAuto: 41, minQuayMoi: '2K', minQuayAuto: '3K', minutesAdd: 12, basePercentage: 74 },
    'Almighty Zeus Wilds': { baseQuayMoi: 33, baseQuayAuto: 53, minQuayMoi: '5K', minQuayAuto: '6K', minutesAdd: 15, basePercentage: 95 },
    '108 Vị Anh Hùng': { baseQuayMoi: 24, baseQuayAuto: 46, minQuayMoi: '3K', minQuayAuto: '4K', minutesAdd: 14, basePercentage: 82 },
    'Thủy Hử Mới': { baseQuayMoi: 27, baseQuayAuto: 48, minQuayMoi: '3K', minQuayAuto: '4K', minutesAdd: 10, basePercentage: 85 },
    '25000 Talons': { baseQuayMoi: 30, baseQuayAuto: 51, minQuayMoi: '4K', minQuayAuto: '5K', minutesAdd: 13, basePercentage: 91 },
    '15 Đinh Ba': { baseQuayMoi: 19, baseQuayAuto: 40, minQuayMoi: '2K', minQuayAuto: '3K', minutesAdd: 11, basePercentage: 71 },
    'Super 777': { baseQuayMoi: 26, baseQuayAuto: 47, minQuayMoi: '3K', minQuayAuto: '4K', minutesAdd: 12, basePercentage: 84 },
    'Châu Phi X Up': { baseQuayMoi: 22, baseQuayAuto: 44, minQuayMoi: '2K', minQuayAuto: '3K', minutesAdd: 15, basePercentage: 79 },
    'Thần Tài Kim Cổ': { baseQuayMoi: 31, baseQuayAuto: 52, minQuayMoi: '4K', minQuayAuto: '5K', minutesAdd: 14, basePercentage: 92 },
    'Đế Chế Thần Biển Poseidon': { baseQuayMoi: 34, baseQuayAuto: 54, minQuayMoi: '5K', minQuayAuto: '6K', minutesAdd: 13, basePercentage: 97 },
    'Amazing Pharaoh': { baseQuayMoi: 25, baseQuayAuto: 46, minQuayMoi: '3K', minQuayAuto: '4K', minutesAdd: 11, basePercentage: 83 },
    'Amazon Ngự Trị': { baseQuayMoi: 29, baseQuayAuto: 50, minQuayMoi: '4K', minQuayAuto: '5K', minutesAdd: 12, basePercentage: 88 },
    'Cái Lưỡi Cày Và Quặng': { baseQuayMoi: 17, baseQuayAuto: 38, minQuayMoi: '2K', minQuayAuto: '2K', minutesAdd: 15, basePercentage: 68 },
    'Lặn Thú': { baseQuayMoi: 21, baseQuayAuto: 42, minQuayMoi: '2K', minQuayAuto: '3K', minutesAdd: 14, basePercentage: 75 },
    'Mảnh Rồng': { baseQuayMoi: 32, baseQuayAuto: 52, minQuayMoi: '5K', minQuayAuto: '6K', minutesAdd: 13, basePercentage: 93 }
  };

  // Update game info - CHỈ GỌI KHI PHÂN TÍCH XONG
  function updateGameInfo(points, quayMoiEl, quayAutoEl, khungGioEl) {
    if (points >= 1 && points <= 2000) {
      // Lấy tên game từ modal (để dùng cho khung giờ và % như cũ)
      const modalGameTitle = document.getElementById('modalGameTitle');
      const gameName = modalGameTitle ? modalGameTitle.textContent.trim() : '';
      
      // Lấy dữ liệu game hoặc dùng mặc định (CHỈ CHO KHUNG GIỜ VÀ %)
      const gameData = gameDataMap[gameName] || {
        baseQuayMoi: 35,
        baseQuayAuto: 47,
        minQuayMoi: '8K',
        minQuayAuto: '7K',
        minutesAdd: 13,
        basePercentage: 94
      };
      
      // ===== LOGIC MỚI CHO SỐ VÒNG QUAY =====
      // 1 điểm = 1,000 VNĐ
      // Vốn: points (ví dụ: 1000 = 1 triệu VNĐ)
      // Ngưỡng nổ = 50% vốn
      // Quay mồi = 60% ngưỡng nổ
      // Quay auto = 40% ngưỡng nổ
      
      const vonBanDau = points; // Vốn ban đầu (điểm)
      const nguongNo = Math.floor(vonBanDau * 0.5); // 50% vốn để nổ
      
      // Tính tổng tiền cần quay cho mỗi loại
      const tongQuayMoi = Math.floor(nguongNo * 0.6); // 60% ngưỡng nổ cho quay mồi
      const tongQuayAuto = Math.floor(nguongNo * 0.4); // 40% ngưỡng nổ cho quay auto
      
      // Tính số vòng và mức cược dựa trên tổng tiền
      // Quay mồi: Cược 3-5K/vòng
      const cuocQuayMoi = Math.floor(Math.random() * 3) + 3; // Random 3-5K
      const soVongQuayMoi = Math.floor(tongQuayMoi / cuocQuayMoi);
      
      // Quay auto: Cược 5-8K/vòng (cao hơn)
      const cuocQuayAuto = Math.floor(Math.random() * 4) + 5; // Random 5-8K
      const soVongQuayAuto = Math.floor(tongQuayAuto / cuocQuayAuto);
      
      // ===== ĐIỀU CHỈNH BUỔI TỐI (18h-23h) - GIỜ VÀNG =====
      const currentHour = new Date().getHours();
      const isNightTime = currentHour >= 18 && currentHour <= 23;
      
      let nightBonus = { vong: 0, tien: 0 };
      if (isNightTime) {
        nightBonus.vong = Math.floor(Math.random() * 6) + 5; // +5-10 vòng
        nightBonus.tien = Math.floor(Math.random() * 3) + 3; // +3-5K
      }
      
      // Áp dụng bonus buổi tối
      const finalQuayMoiVong = soVongQuayMoi + (isNightTime ? nightBonus.vong : 0);
      const finalQuayAutoVong = soVongQuayAuto + (isNightTime ? nightBonus.vong : 0);
      const finalCuocQuayMoi = cuocQuayMoi + (isNightTime ? nightBonus.tien : 0);
      const finalCuocQuayAuto = cuocQuayAuto + (isNightTime ? nightBonus.tien : 0);
      
      // Hiển thị kết quả - SỐ VÒNG QUAY (LOGIC MỚI)
      if (quayMoiEl) {
        quayMoiEl.textContent = `${finalQuayMoiVong} vòng - Mức Tối Thiểu ${finalCuocQuayMoi}K`;
      }
      
      if (quayAutoEl) {
        quayAutoEl.textContent = `${finalQuayAutoVong} vòng - Mức Tối Thiểu ${finalCuocQuayAuto}K`;
      }
      
      // KHUNG GIỜ (GIỮ NGUYÊN LOGIC CŨ)
      if (khungGioEl) {
        const now = new Date();
        const currentHours = String(now.getHours()).padStart(2, '0');
        const currentMinutes = String(now.getMinutes()).padStart(2, '0');
        
        const futureTime = new Date(now.getTime() + gameData.minutesAdd * 60000);
        const futureHours = String(futureTime.getHours()).padStart(2, '0');
        const futureMinutes = String(futureTime.getMinutes()).padStart(2, '0');
        
        khungGioEl.textContent = `${currentHours}:${currentMinutes} - ${futureHours}:${futureMinutes}`;
      }
      
      // TỶ LỆ % (GIỮ NGUYÊN LOGIC CŨ)
      const percentVariation = Math.floor(Math.random() * 3) + 3;
      const finalPercentage = Math.min(99, Math.max(60, gameData.basePercentage + (Math.random() > 0.5 ? percentVariation : -percentVariation)));
      
      // Cập nhật % hiển thị
      const percentageValue = document.querySelector('.percentage-value');
      if (percentageValue) {
        percentageValue.textContent = `${finalPercentage}%`;
      }
      
      console.log('📊 Game info updated:', gameName, 'Points:', points, 'Percentage:', finalPercentage);
    }
  }
  
  // Action buttons handlers
  document.getElementById('btnQuayMoi')?.addEventListener('click', function() {
    // Kiểm tra xu trước khi quay
    const currentUser = getCurrentUser();
    if (!currentUser) {
      showNotification('Vui lòng đăng nhập lại!', 'error');
      closeGameDetailModal();
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
      return;
    }
    
    const userBalance = currentUser.balance || currentUser.xu || 0;
    
    // Nếu hết xu thì hiển thị popup cảnh báo
    if (userBalance === 0) {
      closeGameDetailModal();
      showWarningPopup(userBalance, 10);
      return;
    }
    
    alert('Tính năng QUAY MỚI đang được phát triển!');
  });
  
  document.getElementById('btnQuayAuto')?.addEventListener('click', function() {
    // Kiểm tra xu trước khi quay auto
    const currentUser = getCurrentUser();
    if (!currentUser) {
      showNotification('Vui lòng đăng nhập lại!', 'error');
      closeGameDetailModal();
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
      return;
    }
    
    const userBalance = currentUser.balance || currentUser.xu || 0;
    
    // Nếu hết xu thì hiển thị popup cảnh báo
    if (userBalance === 0) {
      closeGameDetailModal();
      showWarningPopup(userBalance, 10);
      return;
    }
    
    alert('Tính năng QUAY AUTO đang được phát triển!');
  });
  
  document.getElementById('btnKhungGio')?.addEventListener('click', function() {
    alert('Tính năng KHUNG GIỜ đang được phát triển!');
  });
  
  document.getElementById('btnAnalysis')?.addEventListener('click', async function() {
    // Kiểm tra đã phân tích chưa
    if (window.hasAnalyzed) {
      showNotification('Bạn đã phân tích rồi! Đóng modal để phân tích lại.', 'warning');
      return;
    }
    
    // Kiểm tra đang phân tích
    if (window.isAnalyzing) {
      return; // Đang phân tích, không cho bấm nữa
    }
    
    const pointInput = document.getElementById('pointInput');
    const points = parseInt(pointInput?.value) || 0;
    
    if (points >= 1 && points <= 1000) {
      // Kiểm tra xu trước khi phân tích
      const currentUser = getCurrentUser();
      if (!currentUser) {
        showNotification('Vui lòng đăng nhập lại!', 'error');
        return;
      }
      
      const userBalance = currentUser.balance || currentUser.xu || 0;
      
      if (userBalance < 10) {
        showNotification('Bạn cần ít nhất 10 xu để phân tích!', 'warning');
        return;
      }
      
      // Đánh dấu đang phân tích
      window.isAnalyzing = true;
      
      // Disable button và input
      const btnAnalysis = document.getElementById('btnAnalysis');
      if (btnAnalysis) {
        btnAnalysis.style.opacity = '0.5';
        btnAnalysis.style.cursor = 'not-allowed';
      }
      if (pointInput) {
        pointInput.disabled = true;
      }
      
      // Hiển thị loading progress và phân tích
      await showAnalysisWithLoading(points);
      
      // Reset trạng thái sau khi xong
      window.isAnalyzing = false;
    } else {
      showNotification('Vui lòng nhập điểm từ 1-1000 để phân tích!', 'warning');
    }
  });
  
  // Show analysis with loading progress - BAR NGAY DƯỚI BUTTON PHÂN TÍCH
  async function showAnalysisWithLoading(points) {
    // Tìm button phân tích trong modal
    const analysisBtn = document.querySelector('.analysis-btn');
    if (!analysisBtn) return;
    
    // Tạo loading bar ngay dưới button phân tích
    const loadingBar = document.createElement('div');
    loadingBar.className = 'analysis-loading-bar-inline';
    loadingBar.innerHTML = `
      <div class="loading-bar-container-inline">
        <div class="loading-bar-text">
          <span class="loading-bar-title">🎯 TIẾN TRÌNH PHÂN TÍCH</span>
          <span class="loading-bar-percentage" id="loadingBarPercentage">83%</span>
        </div>
        <div class="loading-bar-progress">
          <div class="loading-bar-fill" id="loadingBarFill"></div>
        </div>
      </div>
    `;
    
    // Chèn ngay sau button phân tích
    analysisBtn.parentNode.insertBefore(loadingBar, analysisBtn.nextSibling);
    
    // Hiển thị loading bar với animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        loadingBar.classList.add('show');
      });
    });
    
    // Chạy progress từ 0 đến 100%
    const progressFill = document.getElementById('loadingBarFill');
    const percentageText = document.getElementById('loadingBarPercentage');
    
    let progress = 0;
    const duration = 3500; // 3-4 giây như yêu cầu
    const startTime = performance.now();
    
    function animateProgress(currentTime) {
      const elapsed = currentTime - startTime;
      progress = Math.min((elapsed / duration) * 100, 100);
      
      progressFill.style.width = progress + '%';
      percentageText.textContent = Math.floor(progress) + '%';
      
      if (progress < 100) {
        requestAnimationFrame(animateProgress);
      } else {
        // Loading đầy 100% rồi mới hiện kết quả
        setTimeout(async () => {
          loadingBar.classList.remove('show');
          
          setTimeout(() => {
            loadingBar.remove();
          }, 300);
          
          // Cập nhật dữ liệu game (%, vòng quay, khung giờ)
          const quayMoiSubtitle = document.getElementById('quayMoiSubtitle');
          const quayAutoSubtitle = document.getElementById('quayAutoSubtitle');
          const khungGioSubtitle = document.getElementById('khungGioSubtitle');
          
          // Gọi updateGameInfo sẽ tự động cập nhật % và các thông tin khác
          updateGameInfo(points, quayMoiSubtitle, quayAutoSubtitle, khungGioSubtitle);
          
          // Đánh dấu đã phân tích - sẽ trừ xu khi đóng modal
          window.hasAnalyzed = true;
          
          // Hiệu ứng sáng lên các nút action sau khi phân tích xong
          activateActionButtons();
          
          // KHÔNG hiển thị popup thông báo nữa
        }, 300);
      }
    }
    
    requestAnimationFrame(animateProgress);
  }
  
  // Trừ 10 xu cho phân tích
  async function deductXuForAnalysis() {
    const authToken = localStorage.getItem('auth_token');
    if (!authToken) {
      console.error('❌ Không có auth token');
      showNotification('Vui lòng đăng nhập lại!', 'error');
      return false;
    }
    
    try {
      const response = await fetch('/api/user/deduct-xu', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount: 10 })
      });
      
      if (response.ok) {
        const data = await response.json();
        const newBalance = data.newBalance || data.balance;
        updateLocalBalance(newBalance);
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        showNotification('Không thể trừ xu. Vui lòng thử lại!', 'error');
        console.error('Lỗi API:', errorData);
        return false;
      }
    } catch (error) {
      console.error('❌ Lỗi khi trừ xu:', error);
      showNotification('Lỗi kết nối', 'error');
      return false;
    }
  }
  
  // Get golden time (current + 13 minutes)
  function getGoldenTime() {
    const now = new Date();
    const futureTime = new Date(now.getTime() + 13 * 60000);
    const hours = String(futureTime.getHours()).padStart(2, '0');
    const minutes = String(futureTime.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  
  // Back to top button
  const backToTopBtn = document.getElementById('backToTop');
  window.addEventListener('scroll', function() {
    if (window.scrollY > 300) {
      backToTopBtn.classList.add('show');
    } else {
      backToTopBtn.classList.remove('show');
    }
  });
  
  backToTopBtn.addEventListener('click', function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  
  // Refresh user data from server when page loads
  async function refreshUserDataOnLoad() {
    const authToken = localStorage.getItem('auth_token');
    if (!authToken) {
      console.log('⚠️ No auth token, redirecting to login');
      window.location.href = '/';
      return;
    }
    
    // Set loading state in UI
    const balanceEl = document.getElementById('balanceAmount');
    const vipEl = document.getElementById('userVipLevel');
    const usernameEl = document.getElementById('currentUsername');
    
    if (balanceEl) balanceEl.textContent = '...';
    if (vipEl) vipEl.textContent = 'VIP ...';
    if (usernameEl) usernameEl.textContent = 'Đang tải...';
    
    try {
      console.log('🔄 [GAME-LIST] Fetching fresh user data from server...');
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ [GAME-LIST] Fresh user data loaded:', data);
        
        // Normalize and save user data with all aliases
        const normalizedUser = {
          ...data.user,
          xu: data.user.xu ?? data.user.balance ?? 0,
          balance: data.user.xu ?? data.user.balance ?? 0,
          coins: data.user.xu ?? data.user.balance ?? 0,
          vip: data.user.vip ?? data.user.vip_level ?? 0,
          vip_level: data.user.vip ?? data.user.vip_level ?? 0,
          vipLevel: data.user.vip ?? data.user.vip_level ?? 0,
          _lastUpdated: Date.now()
        };
        
        // Cập nhật localStorage với data mới từ server
        localStorage.setItem('current_user', JSON.stringify(normalizedUser));
        console.log('💾 [GAME-LIST] Saved normalized data to localStorage:', normalizedUser);
        
        // Cập nhật UI
        updateUserUI(normalizedUser);
        
      } else {
        console.error('❌ [GAME-LIST] Failed to fetch user data');
        const errorText = await response.text();
        console.error('Error:', errorText);
        
        // Show error in UI
        if (balanceEl) balanceEl.textContent = 'Lỗi';
        if (vipEl) vipEl.textContent = 'VIP ?';
        if (usernameEl) usernameEl.textContent = 'Lỗi tải dữ liệu';
      }
    } catch (error) {
      console.error('❌ [GAME-LIST] Error refreshing user data:', error);
      
      // Show error in UI
      if (balanceEl) balanceEl.textContent = 'Lỗi';
      if (vipEl) vipEl.textContent = 'VIP ?';
      if (usernameEl) usernameEl.textContent = 'Lỗi tải dữ liệu';
    }
  }
  
  // Update user UI with fresh data
  function updateUserUI(user) {
    console.log('🔄 Updating user UI with:', user);
    console.log('💰 Raw balance data:', {
      xu: user.xu,
      balance: user.balance,
      coins: user.coins
    });
    console.log('👑 Raw VIP data:', {
      vip: user.vip,
      vip_level: user.vip_level,
      vipLevel: user.vipLevel
    });
    
    const usernameEl = document.getElementById('currentUsername');
    const balanceEl = document.getElementById('balanceAmount');
    const vipEl = document.getElementById('userVipLevel');
    const statusDotEl = document.getElementById('userStatusDot');
    
    console.log('📍 Elements found:', {
      usernameEl: !!usernameEl,
      balanceEl: !!balanceEl,
      vipEl: !!vipEl,
      statusDotEl: !!statusDotEl
    });
    
    if (usernameEl) {
      usernameEl.textContent = user.username || 'Unknown';
      console.log('✅ Username updated');
    }
    
    if (balanceEl) {
      const balance = user.xu ?? user.balance ?? user.coins ?? 0;
      balanceEl.textContent = balance.toLocaleString();
      console.log('💰 Balance updated to:', balance);
      
      // Add animation to highlight update
      balanceEl.style.color = '#22c55e';
      balanceEl.style.fontWeight = 'bold';
      setTimeout(() => {
        balanceEl.style.color = '';
        balanceEl.style.fontWeight = '';
      }, 800);
    }
    
    if (vipEl) {
      const vipLevel = user.vip ?? user.vip_level ?? user.vipLevel ?? 0;
      vipEl.textContent = `VIP ${vipLevel}`;
      console.log('👑 VIP updated to:', vipLevel);
      
      // Animation cho VIP badge
      vipEl.style.transform = 'scale(1.1)';
      vipEl.style.color = '#fbbf24';
      setTimeout(() => {
        vipEl.style.transform = 'scale(1)';
        vipEl.style.color = '';
      }, 300);
    }
    
    if (statusDotEl) {
      const isActive = user.active === 1 || user.active === true;
      statusDotEl.classList.remove('online', 'offline');
      statusDotEl.classList.add(isActive ? 'online' : 'offline');
      statusDotEl.title = isActive ? 'Tài khoản hoạt động' : 'Tài khoản bị khóa';
      console.log('🔴🟢 Status updated');
    }
  }
  
  // Show notification helper
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
      color: white;
      padding: 1rem 2rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      font-weight: 600;
      animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  }
  
  // Show warning popup for low balance
  function showWarningPopup(currentBalance, requiredBalance) {
    const popup = document.getElementById('warningPopup');
    const currentBalanceEl = document.getElementById('warningCurrentBalance');
    const requiredBalanceEl = document.getElementById('warningRequiredBalance');
    const closeBtn = document.getElementById('warningCloseBtn');
    
    if (!popup) {
      console.error('Warning popup not found');
      return;
    }
    
    // Update balance values
    if (currentBalanceEl) {
      currentBalanceEl.innerHTML = `${currentBalance} <small>CR</small>`;
    }
    if (requiredBalanceEl) {
      requiredBalanceEl.innerHTML = `${requiredBalance} <small>CR</small>`;
    }
    
    // Show popup
    popup.classList.add('show');
    
    // Close button handler
    const closePopup = () => {
      popup.classList.remove('show');
    };
    
    if (closeBtn) {
      closeBtn.addEventListener('click', closePopup);
    }
    
    // Close on overlay click
    popup.addEventListener('click', (e) => {
      if (e.target === popup) {
        closePopup();
      }
    });
    
    // Close on Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape' && popup.classList.contains('show')) {
        closePopup();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
    
    console.log('⚠️ Warning popup displayed:', { currentBalance, requiredBalance });
  }
})();
