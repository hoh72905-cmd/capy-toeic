// TOEIC Part 6 (text completion), written for Capy TOEIC.
// Each text has 4 blanks [1]–[4]; one of them is usually a sentence-insertion blank.
// Passages deliberately reuse words from the TOEIC Service List so vocabulary is met in context.
// level: 1 (≈ 450–600), 2 (≈ 600–750), 3 (≈ 750+). vi = explanation.

const B = (o, a, vi) => ({ o, a, vi })

export const PART6 = [
  {
    id: 'p6-1', level: 1, type: 'Email', title: 'Xác nhận đặt phòng',
    text: `To: Daniel Moreno
From: Seaview Hotel Reservations
Subject: Your reservation

Dear Mr. Moreno,

Thank you for choosing the Seaview Hotel. This e-mail is to [1] your reservation for a double room from June 12 to June 15.

Check-in begins at 3 p.m., and checkout is at 11 a.m. A complimentary breakfast is served in our cafeteria [2] 6:30 and 10 a.m. every day.

If you need to cancel or reschedule your stay, please notify us at least 48 hours in advance. [3]

We look forward to [4] you soon.

Sincerely,
Laura Kim, Reservations Clerk`,
    qs: [
      B(['confirm', 'confirming', 'confirmation', 'confirmed'], 0, 'is to + V nguyên mẫu (mục đích của email) → confirm.'),
      B(['from', 'between', 'during', 'since'], 1, 'between A and B: trong khoảng từ 6:30 đến 10 giờ.'),
      B(['Our lobby was renovated last year.', 'Otherwise, a fee of one night’s stay will be charged.', 'The airport is located downtown.', 'Breakfast is not available on weekends.'], 1,
        'Câu trước nói về hủy/đổi lịch trước 48 giờ → câu tiếp theo nói hậu quả nếu không làm: "Otherwise, …".'),
      B(['welcome', 'welcoming', 'welcomed', 'be welcomed'], 1, 'look forward to + V-ing → welcoming.'),
    ],
  },
  {
    id: 'p6-2', level: 1, type: 'Notice', title: 'Thông báo bảo trì thang máy',
    text: `NOTICE TO ALL TENANTS

The elevators in the north wing of Carlton Tower will be [1] for maintenance on Saturday, March 4, from 8 a.m. to 5 p.m.

During this time, tenants and visitors should use the elevators in the south wing. [2] Signs will be posted in the lobby to direct people.

We apologize for any [3] this may cause. If you have any questions, please contact the building supervisor at extension 210. Thank you for your [4].

Carlton Tower Management`,
    qs: [
      B(['close', 'closing', 'closed', 'closure'], 2, 'will be + V3 (bị động): thang máy "bị đóng" để bảo trì → closed.'),
      B(['The stairs will also remain open.', 'The building was built in 1995.', 'Parking fees will increase next month.', 'Tenants must renew their lease.'], 0,
        'Đoạn đang nói về cách đi lại khi thang máy đóng → thêm thông tin "cầu thang bộ vẫn mở".'),
      B(['convenience', 'inconvenience', 'convenient', 'conveniently'], 1, 'apologize for any + danh từ mang nghĩa tiêu cực → inconvenience (sự bất tiện).'),
      B(['patient', 'patiently', 'patience', 'patients'], 2, 'your + danh từ: Thank you for your patience (sự kiên nhẫn).'),
    ],
  },
  {
    id: 'p6-3', level: 1, type: 'Advertisement', title: 'Quảng cáo phòng tập',
    text: `Join FitLife Gym Today!

Are you looking for a convenient place to exercise? FitLife Gym is located just two minutes from the Central subway station and is open 24 hours a day, [1] weekends.

New members who [2] before April 30 will receive one month of free personal training. [3] All members also enjoy free use of our sauna and lockers.

To sign up, visit our website or stop by our front desk. Our friendly staff will be happy to give you a [4] tour of the facilities.`,
    qs: [
      B(['include', 'including', 'included', 'inclusion'], 1, 'including + danh từ = bao gồm cả cuối tuần.'),
      B(['enroll', 'enrolls', 'enrolling', 'to enroll'], 0, 'Mệnh đề quan hệ "who + V", chủ ngữ "members" số nhiều → enroll.'),
      B(['Our trainers are certified and experienced.', 'The gym will close next month.', 'Membership fees must be paid in cash.', 'The subway station is under construction.'], 0,
        'Câu trước nhắc huấn luyện cá nhân miễn phí → câu tiếp giới thiệu chất lượng huấn luyện viên.'),
      B(['complimentary', 'complimented', 'complement', 'compliment'], 0, 'a + tính từ + tour: complimentary = miễn phí.'),
    ],
  },
  {
    id: 'p6-4', level: 2, type: 'Memo', title: 'Quy trình hoàn ứng chi phí mới',
    text: `MEMO
To: All Sales Staff
From: Accounting Department
Re: New reimbursement procedure

Starting next month, all travel expense reports must be submitted [1] through our new online system. Paper forms will no longer be accepted.

To be reimbursed, employees must upload a copy of each receipt and invoice. [2] Reports that are incomplete will be returned to the sender.

The accounting team will hold a short training session on May 3 for anyone who is [3] with the system. Please register with Ms. Tanaka by April 28.

We believe the new procedure will make the process faster and more [4] for everyone.`,
    qs: [
      B(['electronic', 'electronically', 'electronics', 'electrician'], 1, 'Bổ nghĩa cho động từ "submitted" → trạng từ electronically.'),
      B(['Receipts must clearly show the date and amount.', 'The sales team exceeded its target.', 'The new system was very expensive.', 'Travel is not allowed this year.'], 0,
        'Đang nói yêu cầu về biên lai → câu tiếp nói biên lai phải ghi rõ ngày và số tiền.'),
      B(['familiar', 'unfamiliar', 'familiarity', 'familiarize'], 1, 'Buổi đào tạo dành cho người CHƯA quen hệ thống → unfamiliar with.'),
      B(['efficiency', 'efficient', 'efficiently', 'efficiencies'], 1, 'make + O + more + tính từ (faster and more efficient).'),
    ],
  },
  {
    id: 'p6-5', level: 2, type: 'Letter', title: 'Thư mời phỏng vấn',
    text: `Dear Ms. Nguyen,

Thank you for applying for the position of administrative assistant at Brightway Logistics. We were impressed by your résumé and would like to invite you for an interview.

The interview will take place on Tuesday, July 9, at 10 a.m. at our headquarters on Lake Street. It will last [1] one hour. [2]

Please bring a form of identification and two copies of your certificates. Parking is available in the garage [3] to the building.

Kindly reply to this letter by July 3 to confirm your [4]. We look forward to meeting you.

Sincerely,
Peter Hall, Recruitment Coordinator`,
    qs: [
      B(['approximate', 'approximately', 'approximation', 'approximated'], 1, 'Bổ nghĩa cho cụm số lượng "one hour" → trạng từ approximately.'),
      B(['You will meet with the office manager and a member of our team.', 'Our company was founded in 1980.', 'The position has already been filled.', 'Please send us your bank details.'], 0,
        'Đang mô tả buổi phỏng vấn → thêm chi tiết sẽ gặp ai. Câu "đã tuyển xong" mâu thuẫn với thư mời.'),
      B(['adjacent', 'nearby', 'beside', 'along'], 0, 'adjacent to = kế bên (đi với "to"). "beside", "along" không cần "to"; "nearby" không đi với "to".'),
      B(['attend', 'attendance', 'attendant', 'attended'], 1, 'your + danh từ: confirm your attendance (xác nhận việc tham dự).'),
    ],
  },
  {
    id: 'p6-6', level: 2, type: 'Article', title: 'Tin doanh nghiệp: sáp nhập',
    text: `Greenleaf Foods to Merge with Harvest Market

CHICAGO — Greenleaf Foods announced on Monday that it will merge with Harvest Market, a regional grocery chain. The merger is expected to be [1] by the end of the year.

Greenleaf, which produces organic snacks and beverages, has seen strong growth over the past five years. [2] With the merger, its products will be sold in more than 300 supermarkets nationwide.

Company spokesperson Linda Shaw said that no store closures are planned. "Customers will continue to find the same high-quality goods at [3] prices," she said.

Harvest Market employees will keep their current positions, [4] some managers may be relocated to Greenleaf's headquarters.`,
    qs: [
      B(['finalize', 'finalized', 'finalizing', 'final'], 1, 'be + V3 (bị động): việc sáp nhập "được hoàn tất" → finalized.'),
      B(['However, its products have been available only in a few cities.', 'Organic food is not popular.', 'Harvest Market was founded last week.', 'The weather in Chicago was cold.'], 0,
        'Câu sau nói "nhờ sáp nhập, sản phẩm sẽ có ở hơn 300 siêu thị" → trước đó phải là hạn chế hiện tại: chỉ có ở vài thành phố.'),
      B(['afford', 'affordable', 'affordably', 'affordability'], 1, 'at + tính từ + prices: affordable prices (giá phải chăng).'),
      B(['because', 'although', 'so', 'unless'], 1, 'Hai ý tương phản (giữ vị trí ↔ có thể bị điều chuyển) → although.'),
    ],
  },
  {
    id: 'p6-7', level: 2, type: 'Email', title: 'Phản hồi khiếu nại sản phẩm lỗi',
    text: `Dear Mr. Patel,

Thank you for contacting Homeline Appliances. We are sorry to hear that the microwave you purchased last week is [1].

Since your product is still under warranty, we will gladly replace it at no cost. [2] Our courier will pick up the faulty item from your residence and deliver a new one at the same time.

Please reply with a time that is convenient for you. Our delivery staff are available on weekdays from 9 a.m. to 6 p.m.

Once again, we apologize for the problem and appreciate your [3]. As a token of our [4], we have attached a voucher for 15% off your next purchase.

Best regards,
Sandra Lee, Customer Service`,
    qs: [
      B(['defect', 'defective', 'defectively', 'defects'], 1, 'be + tính từ: is defective (bị lỗi).'),
      B(['You do not need to return the item to the store.', 'Warranties are not available online.', 'Microwaves are very popular.', 'Please pay the shipping fee in advance.'], 0,
        'Câu sau: nhân viên sẽ đến lấy hàng tại nhà → trước đó: bạn không cần mang trả cửa hàng.'),
      B(['understand', 'understanding', 'understood', 'understandable'], 1, 'your + danh từ: appreciate your understanding.'),
      B(['appreciate', 'appreciation', 'appreciative', 'appreciatively'], 1, 'a token of our + danh từ: appreciation (lòng biết ơn).'),
    ],
  },
  {
    id: 'p6-8', level: 3, type: 'Press release', title: 'Thông cáo: ra mắt dịch vụ',
    text: `FOR IMMEDIATE RELEASE

Swiftpay Launches Mobile Payment Service for Small Retailers

SINGAPORE — Swiftpay Inc. today launched SwiftPOS, a mobile payment service designed [1] for small retailers and restaurants.

With SwiftPOS, merchants can accept credit card payments using only a smartphone or tablet. The service requires no expensive hardware, and transaction fees are among the lowest in the industry. [2]

"Many small businesses have told us that existing systems are too costly and complicated," said CEO Ravi Menon. "SwiftPOS was developed to [3] these concerns."

Merchants who sign up before October 1 will have their setup fee waived. Detailed specifications and pricing are [4] on the company's website.`,
    qs: [
      B(['specific', 'specifically', 'specify', 'specification'], 1, 'designed + trạng từ + for: specifically for (dành riêng cho).'),
      B(['In addition, setup takes less than ten minutes.', 'Swiftpay was founded by Mr. Menon’s father.', 'Most customers prefer to pay in cash.', 'The office is closed on weekends.'], 0,
        'Đang liệt kê ưu điểm (không cần phần cứng, phí thấp) → thêm một ưu điểm: "In addition, …".'),
      B(['address', 'speak', 'respond', 'reply'], 0, 'address concerns = giải quyết những lo ngại. respond/reply cần "to".'),
      B(['accessible', 'access', 'accessibly', 'accessing'], 0, 'be + tính từ: are accessible on the website (có thể xem).'),
    ],
  },
  {
    id: 'p6-9', level: 3, type: 'Email', title: 'Thay đổi nhà cung cấp',
    text: `To: Purchasing Team
From: Grace Liu, Operations Manager
Subject: Supplier change

Team,

As discussed at last week's meeting, we will stop ordering office supplies from Dalton Stationery at the end of this quarter. [1] repeated late deliveries and billing discrepancies, we have decided to work with a new vendor, Paperworks Ltd.

Paperworks has agreed to deliver all orders within two business days and to offer a 10% discount on bulk purchases. [2] I am confident that this change will reduce costs and improve reliability.

Please do not place any new orders with Dalton after June 15. Any outstanding invoices from Dalton should be [3] to the accounting department by June 30.

Mr. Ortiz will coordinate the transition. Direct any questions [4] him.

Grace`,
    qs: [
      B(['Because', 'Due to', 'Although', 'Despite'], 1, 'Theo sau là cụm danh từ (repeated late deliveries…) và mang nghĩa nguyên nhân → Due to.'),
      B(['They will also assign us a dedicated account manager.', 'Dalton has been our supplier for ten years.', 'Office supplies are rarely needed.', 'The meeting lasted two hours.'], 0,
        'Đang liệt kê lợi ích Paperworks đưa ra → thêm một lợi ích ("also").'),
      B(['forwarded', 'forwarding', 'forward', 'forwards'], 0, 'should be + V3 (bị động): hóa đơn "được chuyển" → forwarded.'),
      B(['for', 'at', 'to', 'by'], 2, 'direct questions to someone = gửi thắc mắc cho ai.'),
    ],
  },
  {
    id: 'p6-10', level: 3, type: 'Notice', title: 'Chính sách làm việc linh hoạt',
    text: `Flexible Work Policy Update

Effective September 1, eligible employees at Norland Insurance may choose a flextime schedule. Under the new policy, staff can start work at any time between 7 and 10 a.m., [1] they complete eight hours per day.

To participate, employees must first obtain written authorization from their supervisor. [2] Requests will be reviewed on an individual basis, and approval may depend on the needs of each department.

The policy is part of our ongoing effort to improve employee wellness and productivity. A recent questionnaire showed that over 70% of respondents would [3] a more flexible schedule.

For further details, please refer to the updated employee handbook, which is now [4] on the company intranet.`,
    qs: [
      B(['as long as', 'as soon as', 'even though', 'so that'], 0, 'as long as = miễn là (điều kiện).'),
      B(['A request form can be downloaded from the HR webpage.', 'The company was founded in 1950.', 'Insurance rates increased last year.', 'Most supervisors work from home.'], 0,
        'Đang nói thủ tục đăng ký → thêm thông tin lấy mẫu đơn ở đâu.'),
      B(['prefer', 'prefers', 'preferred', 'preference'], 0, 'would + V nguyên mẫu → prefer.'),
      B(['avail', 'available', 'availability', 'availably'], 1, 'is now + tính từ: available (có sẵn).'),
    ],
  },
]
