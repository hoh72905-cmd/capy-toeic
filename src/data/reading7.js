// TOEIC Part 7 (reading comprehension), written for Capy TOEIC.
// docs: one passage (single) or two/three (multiple passages). Question types follow the test:
// main idea, detail, NOT true, inference, vocabulary-in-context, sentence position, cross-reference.
// Passages reuse words from the TOEIC Service List. level: 1 (≈ 450–600), 2 (≈ 600–750), 3 (≈ 750+).

const D = (type, text) => ({ type, text })
const Q = (q, o, a, vi) => ({ q, o, a, vi })

export const PART7 = [
  {
    id: 'p7-1', level: 1, title: 'Thông báo mất điện',
    docs: [D('Notice', `ATTENTION ALL RESIDENTS

Riverside Apartments will have a scheduled power outage on Thursday, May 18, from 1 p.m. to 4 p.m. Electricians will be upgrading the building's electrical system.

Elevators will not operate during this time. Residents are advised to unplug computers and other electronic appliances before 1 p.m.

We apologize for the inconvenience. For questions, please contact the management office.`)],
    qs: [
      Q('Why will the power be turned off?', ['To repair the elevators', 'To upgrade the electrical system', 'To clean the building', 'To install new appliances'], 1,
        'Câu 2: "Electricians will be upgrading the building\'s electrical system."'),
      Q('What are residents asked to do?', ['Use the stairs only after 4 p.m.', 'Call an electrician', 'Unplug electronic devices', 'Leave the building'], 2,
        '"Residents are advised to unplug computers and other electronic appliances." (unplug = rút phích; appliances ≈ devices)'),
    ],
  },
  {
    id: 'p7-2', level: 1, title: 'Tin nhắn: trễ chuyến tàu',
    docs: [D('Text message chain', `Mia Torres (8:42 A.M.): Hi Ken, my train is delayed because of a signal problem. I'll probably be 30 minutes late.
Ken Adams (8:44 A.M.): No problem. The client meeting starts at 10, right?
Mia Torres (8:45 A.M.): Yes. Could you set up the projector in Conference Room B and print the brochures?
Ken Adams (8:46 A.M.): Sure. How many copies?
Mia Torres (8:47 A.M.): Twelve should be enough.
Ken Adams (8:48 A.M.): Got it. I'll also order coffee and snacks.`)],
    qs: [
      Q('Why is Ms. Torres late?', ['She missed her train.', 'Her train is delayed.', 'She had a client meeting.', 'She is sick.'], 1, '"my train is delayed because of a signal problem."'),
      Q('What will Mr. Adams NOT do?', ['Set up a projector', 'Print brochures', 'Order refreshments', 'Call the client'], 3,
        'Ken sẽ lắp máy chiếu, in brochure, đặt cà phê và đồ ăn nhẹ (refreshments). Không nhắc gọi khách hàng.'),
      Q('At 8:47 A.M., what does Ms. Torres mean when she writes, "Twelve should be enough"?', ['The meeting has twelve participants at most.', 'She wants twelve cups of coffee.', 'Twelve copies of the brochure are needed.', 'The meeting will last twelve minutes.'], 2,
        'Ken hỏi "How many copies?" → 12 bản là đủ.'),
    ],
  },
  {
    id: 'p7-3', level: 1, title: 'Quảng cáo tiệm bánh',
    docs: [D('Advertisement', `Sunrise Bakery — Grand Opening!

Visit our new location at 45 Maple Avenue, next to the Westfield Mall.

• Freshly baked bread, pastries, and cakes every morning
• Vegetarian sandwiches and homemade soup for lunch
• Free coffee with any purchase during our opening week (June 3–9)

Open Monday to Saturday, 6 a.m. – 7 p.m. Closed Sundays.
Custom birthday cakes can be ordered online at least three days in advance.`)],
    qs: [
      Q('Where is the new bakery located?', ['Inside a shopping mall', 'Next to a shopping mall', 'Across from a station', 'On the second floor of a hotel'], 1, '"next to the Westfield Mall".'),
      Q('What is offered during the opening week?', ['A discount on cakes', 'Free coffee with a purchase', 'Free delivery', 'A cooking class'], 1, '"Free coffee with any purchase during our opening week".'),
      Q('What is indicated about birthday cakes?', ['They are sold only on Sundays.', 'They must be ordered ahead of time.', 'They are vegetarian.', 'They are free for members.'], 1,
        '"…ordered online at least three days in advance" (in advance ≈ ahead of time).'),
    ],
  },
  {
    id: 'p7-4', level: 1, title: 'Email: đổi lịch hẹn nha khoa',
    docs: [D('E-mail', `To: Hannah Price
From: Bright Smile Dental Clinic
Subject: Appointment reminder

Dear Ms. Price,

This is a reminder that your dental checkup is scheduled for Wednesday, October 4, at 2:30 p.m. with Dr. Lewis.

Please arrive ten minutes early to complete a short questionnaire. If you need to reschedule, call our receptionist at 555-0182 at least 24 hours before your appointment.

Please note that our clinic has moved to a new address: 210 Park Street, Suite 5.

Bright Smile Dental Clinic`)],
    qs: [
      Q('What is the purpose of the e-mail?', ['To remind a patient of an appointment', 'To advertise a new dentist', 'To request a payment', 'To cancel an appointment'], 0, 'Subject "Appointment reminder" và câu đầu: "This is a reminder that…".'),
      Q('What is Ms. Price asked to do?', ['Bring her insurance card', 'Fill out a form before her checkup', 'Pay in advance', 'Call Dr. Lewis directly'], 1,
        '"arrive ten minutes early to complete a short questionnaire" (questionnaire ≈ form).'),
      Q('What has changed at the clinic?', ['Its opening hours', 'Its phone number', 'Its location', 'Its dentists'], 2, '"our clinic has moved to a new address".'),
    ],
  },
  {
    id: 'p7-5', level: 2, title: 'Thông báo tuyển dụng',
    docs: [D('Job advertisement', `Marketing Coordinator — Atlas Travel Group

Atlas Travel Group, a leading tour operator with offices in five countries, is seeking an energetic marketing coordinator to join our team in Hanoi.

Responsibilities:
• Plan and coordinate promotional events and trade fairs
• Manage our social media accounts and monthly newsletter
• Work with designers to produce brochures and online advertisements

Requirements:
• Bachelor's degree in marketing or a related field
• At least two years of experience in the tourism or hospitality industry
• Fluent English; knowledge of Japanese is a plus

Applicants should submit a résumé and cover letter to careers@atlastravel.com by August 15. Only shortlisted candidates will be contacted for an interview.`)],
    qs: [
      Q('What is NOT listed as a responsibility of the position?', ['Organizing events', 'Writing a newsletter', 'Training new tour guides', 'Producing advertising materials'], 2,
        'Ba trách nhiệm: sự kiện, mạng xã hội + newsletter, brochure/quảng cáo. Không có đào tạo hướng dẫn viên.'),
      Q('What qualification is preferred but not required?', ['A marketing degree', 'Experience in tourism', 'Ability to speak Japanese', 'Fluency in English'], 2, '"knowledge of Japanese is a plus" = có thì tốt, không bắt buộc.'),
      Q('What is suggested about the application process?', ['All applicants will be interviewed.', 'Some applicants will not receive a reply.', 'Applications can be submitted after August 15.', 'Applicants must visit the Hanoi office.'], 1,
        '"Only shortlisted candidates will be contacted" → người không được chọn sẽ không nhận phản hồi (suy luận).'),
      Q('The word "seeking" in paragraph 1 is closest in meaning to', ['looking for', 'hiding', 'asking', 'following'], 0, 'seek = tìm kiếm ≈ look for.'),
    ],
  },
  {
    id: 'p7-6', level: 2, title: 'Thư gửi khách hàng: tăng giá thuê bao',
    docs: [D('Letter', `Dear Valued Subscriber,

For more than twenty years, Business Weekly has provided readers with timely and reliable news about the economy. — [1] —

Due to rising printing and postage costs, we will increase the price of an annual subscription from $89 to $99, effective January 1. — [2] — Subscribers who renew before December 15 will be able to keep the current rate for one more year.

We are also pleased to announce that all subscribers will now receive free access to our new mobile app, which includes exclusive interviews and market statistics. — [3] —

Thank you for your continued loyalty. — [4] —

Sincerely,
Carla Mendes, Circulation Manager`)],
    qs: [
      Q('Why is the price of a subscription increasing?', ['Because more pages have been added', 'Because of higher printing and mailing costs', 'Because of a new mobile app', 'Because the company was sold'], 1,
        '"Due to rising printing and postage costs" (postage ≈ mailing).'),
      Q('How can subscribers avoid the price increase?', ['By using the mobile app', 'By renewing before December 15', 'By paying in cash', 'By subscribing for two years'], 1, '"Subscribers who renew before December 15 will be able to keep the current rate".'),
      Q('In which of the positions marked [1], [2], [3], and [4] does the following sentence best belong?\n"This is the first price change in five years."', ['[1]', '[2]', '[3]', '[4]'], 1,
        'Câu này nói về việc đổi giá → đặt ngay sau câu thông báo tăng giá, tức vị trí [2].'),
    ],
  },
  {
    id: 'p7-7', level: 2, title: 'Bài báo: khai trương nhà ga mới',
    docs: [D('Article', `New Airport Terminal Opens

PORTVILLE (April 2) — After three years of construction, Portville International Airport officially opened its new Terminal C yesterday. The $400 million terminal will handle all international departures and arrivals.

The spacious building features 24 gates, a larger baggage claim area, and more than 40 shops and restaurants. Travelers can also use free wireless internet and charging stations throughout the terminal.

Airport director Samuel Okafor said the expansion was necessary because passenger numbers have increased steadily over the past decade. "Our old terminal was simply too crowded," he said.

A new shuttle bus service connects Terminal C with the downtown train station every 15 minutes. Parking fees will remain the same.`)],
    qs: [
      Q('What is the article mainly about?', ['The construction of a train station', 'The opening of a new airport building', 'An increase in parking fees', 'A new airline'], 1, 'Tiêu đề và câu đầu: Terminal C mới khai trương.'),
      Q('According to the article, why was Terminal C built?', ['The old terminal was too crowded.', 'The city received a government grant.', 'Airlines requested more shops.', 'The old terminal was damaged.'], 0, '"Our old terminal was simply too crowded" + passenger numbers increased.'),
      Q('What is NOT mentioned as a feature of Terminal C?', ['Free wireless internet', 'A larger baggage claim area', 'A hotel', 'Charging stations'], 2, 'Bài nhắc internet, khu hành lý, trạm sạc; không nhắc khách sạn.'),
      Q('The word "handle" in paragraph 1 is closest in meaning to', ['touch', 'manage', 'carry', 'repair'], 1, 'handle departures and arrivals = xử lý, quản lý các chuyến đi/đến.'),
    ],
  },
  {
    id: 'p7-8', level: 2, title: 'Biểu mẫu phản hồi khách hàng',
    docs: [D('Online form', `Harbor Grill — Customer Feedback

Name: Olivia Grant        Date of visit: March 12
Number of diners: 6       Occasion: Coworker's farewell lunch

Food quality: Excellent   Service: Fair   Atmosphere: Good

Comments: We reserved a private room for our team's farewell luncheon, and the seafood platter and desserts were delicious. However, our main dishes arrived 40 minutes after we ordered, and we had to rush back to the office. The waiter was polite and apologized, but nobody explained the delay. I would come back for the food, but I hope the kitchen becomes more punctual.`)],
    qs: [
      Q('Why did Ms. Grant visit the restaurant?', ['To celebrate a birthday', 'To attend a farewell event for a colleague', 'To meet a client', 'To review the restaurant for a newspaper'], 1, '"Occasion: Coworker\'s farewell lunch".'),
      Q('What was Ms. Grant dissatisfied with?', ['The quality of the seafood', 'The size of the room', 'The waiting time', 'The price of the desserts'], 2, 'Món chính đến sau 40 phút; mong bếp "more punctual".'),
      Q('What is suggested about Ms. Grant?', ['She will probably return to the restaurant.', 'She will ask for a refund.', 'She works at Harbor Grill.', 'She did not like the waiter.'], 0, '"I would come back for the food".'),
    ],
  },
  {
    id: 'p7-9', level: 3, title: 'Email nội bộ: dự án di dời văn phòng',
    docs: [D('E-mail', `To: All Staff
From: Victor Lam, Facilities Manager
Subject: Office relocation update

Dear colleagues,

As you know, our office will relocate to the Tower One building on Bay Road next month. Here is an update on the schedule.

The IT department will move on Friday, June 7, so that the network can be installed and tested before the other teams arrive. The finance and human resources departments will follow on June 14, and all remaining departments will move on June 21.

Movers will provide boxes and labels on the Monday before each move. Please pack your personal belongings and any confidential documents yourself; the movers will handle furniture and equipment. Do not pack your computer — IT staff will disconnect and transport all computers.

Parking at Tower One is limited. Employees who commute by car should apply for a parking permit through the facilities webpage by May 31. The building is also a five-minute walk from Bay Road subway station.

Victor`)],
    qs: [
      Q('Why will the IT department move first?', ['It is the largest department.', 'It needs to set up the network in advance.', 'Its staff requested an earlier date.', 'Its equipment is the most expensive.'], 1,
        '"…so that the network can be installed and tested before the other teams arrive."'),
      Q('What are employees asked to do themselves?', ['Pack their computers', 'Move their furniture', 'Pack personal items and confidential papers', 'Install the network'], 2, '"Please pack your personal belongings and any confidential documents yourself".'),
      Q('When will the human resources department move?', ['June 7', 'June 14', 'June 21', 'May 31'], 1, '"The finance and human resources departments will follow on June 14".'),
      Q('What is implied about Tower One?', ['It has more parking spaces than the current office.', 'Not every employee will be able to park there.', 'It is far from public transportation.', 'It will open on May 31.'], 1,
        '"Parking at Tower One is limited" + phải đăng ký giấy phép → không phải ai cũng có chỗ đậu xe.'),
    ],
  },
  {
    id: 'p7-10', level: 3, title: 'Bài báo: xu hướng làm việc từ xa',
    docs: [D('Article', `Remote Work Reshapes Office Market

By Helen Carter

Two years after many companies adopted flexible work arrangements, demand for traditional office space in Lakeside City has fallen sharply. According to a report released last week by realtor firm Keystone Partners, nearly 18 percent of downtown office space is now vacant — the highest rate in a decade.

Many businesses have chosen to downsize rather than renew long-term leases. "Our employees come to the office only two or three days a week," said Rita Gomez, operations director at software developer Codelink. "It made no sense to pay for a whole floor." Codelink recently moved into a smaller suite and converted the savings into a wellness program for staff.

Not everyone sees the trend as negative. Several landlords are remodeling older buildings into shared workspaces, which can be rented by the day. Others are converting offices into residential apartments, which are in short supply.

Keystone Partners predicts that occupancy rates will remain low next year but could recover as the city attracts new technology firms.`)],
    qs: [
      Q('What is the main topic of the article?', ['A software company\'s new product', 'Changes in demand for office space', 'The rising cost of apartments', 'A new technology firm in Lakeside City'], 1, 'Tiêu đề và đoạn 1: nhu cầu văn phòng giảm mạnh do làm việc từ xa.'),
      Q('What did Codelink do with the money it saved?', ['It hired more developers.', 'It bought a building.', 'It started a program for employee health.', 'It opened a shared workspace.'], 2, '"converted the savings into a wellness program for staff" (wellness ≈ health).'),
      Q('According to the article, what are some landlords doing?', ['Lowering the price of long-term leases', 'Turning offices into homes', 'Selling buildings to Codelink', 'Building new skyscrapers'], 1, '"converting offices into residential apartments".'),
      Q('The word "vacant" in paragraph 1 is closest in meaning to', ['expensive', 'empty', 'modern', 'crowded'], 1, 'vacant = trống ≈ empty.'),
    ],
  },
  {
    id: 'p7-11', level: 3, title: 'Bộ đọc kép: hội nghị và email đăng ký',
    docs: [
      D('Web page', `Asia Retail Forum 2025 — Singapore Convention Center, September 18–19

Registration fees (include lunch and refreshments):
• Early bird (until July 31): $350
• Standard (August 1 – September 10): $450
• Group rate (5 or more attendees from the same company): $320 per person, any time before September 10

Optional workshop on September 17: "Digital Marketing for Retailers" — $90 (limited to 40 participants)

Hotel: Attendees receive a 15% discount at the Marina Bay Hotel when booking through the forum website.`),
      D('E-mail', `To: registration@asiaretailforum.com
From: Daniel Wu, Greenway Supermarkets
Date: August 5
Subject: Registration

Hello,

I would like to register six employees from Greenway Supermarkets for this year's forum. Three of us would also like to attend the digital marketing workshop the day before the forum.

Could you also confirm whether the hotel discount applies if we book rooms by phone rather than online?

Best regards,
Daniel Wu`),
    ],
    qs: [
      Q('What is included in the registration fee?', ['A hotel room', 'Meals and snacks', 'The digital marketing workshop', 'Transportation'], 1, '"Registration fees (include lunch and refreshments)".'),
      Q('How much will Greenway Supermarkets most likely pay per person for forum registration?', ['$320', '$350', '$450', '$90'], 0,
        'Kết hợp 2 văn bản: Greenway đăng ký 6 người (≥ 5 người cùng công ty) trước 10/9 → giá nhóm $320/người.'),
      Q('When will some Greenway employees attend the workshop?', ['September 17', 'September 18', 'September 19', 'July 31'], 0, 'Email: "the workshop the day before the forum"; trang web: workshop ngày 17/9.'),
      Q('What does Mr. Wu ask about?', ['Whether the workshop is full', 'Whether lunch is served', 'Whether the hotel discount applies to phone bookings', 'Whether he can pay by invoice'], 2,
        '"…whether the hotel discount applies if we book rooms by phone rather than online?"'),
      Q('What is suggested about the hotel discount?', ['It is available only to speakers.', 'It may require booking through the website.', 'It is 20 percent.', 'It ends on July 31.'], 1,
        'Trang web: giảm giá "when booking through the forum website" → có thể chỉ áp dụng khi đặt qua web (vì vậy ông Wu mới hỏi).'),
    ],
  },
  {
    id: 'p7-12', level: 3, title: 'Bộ đọc ba: đơn hàng, hóa đơn và email khiếu nại',
    docs: [
      D('Order form', `Officemart — Order #58213     Customer: Lena Fischer, Fischer Design Studio
Item                        Qty   Unit price
Ergonomic office chair       4     $120
Desk lamp (LED)              4     $35
Printer toner cartridge      6     $48
Delivery: Standard (3–5 business days) — free on orders over $500`),
      D('Invoice', `Officemart — Invoice for Order #58213
Ergonomic office chair   4 × $120 = $480
Desk lamp (LED)          4 × $35  = $140
Printer toner cartridge  2 × $48  = $96
Express delivery                    $25
TOTAL                              $741
Note: Remaining toner cartridges are out of stock and will be shipped separately next week at no extra charge.`),
      D('E-mail', `To: support@officemart.com
From: Lena Fischer
Subject: Order #58213

Hello,

I received most of my order yesterday — thank you. However, I noticed two problems on the invoice. First, I selected standard delivery, not express, so I should not have been charged the $25 fee. Second, one of the desk lamps arrived with a cracked base.

Please refund the delivery charge and send a replacement lamp along with the remaining toner cartridges.

Lena Fischer`),
    ],
    qs: [
      Q('How many toner cartridges are still to be delivered?', ['2', '4', '6', '0'], 1, 'Đơn đặt 6 hộp, hóa đơn mới giao 2 → còn 4 hộp gửi sau.'),
      Q('Why does Ms. Fischer believe the delivery fee is incorrect?', ['Her order was over $500.', 'She chose standard delivery.', 'The items arrived late.', 'She is a regular customer.'], 1, '"I selected standard delivery, not express".'),
      Q('What is suggested about standard delivery for Ms. Fischer\'s order?', ['It would have cost $25.', 'It would have been free.', 'It is not available in her area.', 'It takes one day.'], 1,
        'Order form: giao chuẩn miễn phí cho đơn trên $500; đơn của cô > $500 → lẽ ra miễn phí (suy luận từ 2 văn bản).'),
      Q('What problem does Ms. Fischer report with the products?', ['A chair was the wrong color.', 'A lamp was damaged.', 'The toner was the wrong model.', 'A chair was missing.'], 1, '"one of the desk lamps arrived with a cracked base" (cracked ≈ damaged).'),
    ],
  },
]
