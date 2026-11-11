// Dictation lessons, each about 5–6 minutes. s: [English, Vietnamese]
// accent: us | uk | au (TOEIC mixes accents)
export const LESSONS = [
  {
    id: 'l1', title: 'Ở văn phòng buổi sáng', part: 'Part 1 · Mô tả tranh', scene: '🏢', accent: 'us', level: 1,
    s: [
      ['A woman is typing on a laptop.', 'Một người phụ nữ đang gõ trên laptop.'],
      ['Some documents have been placed on the desk.', 'Vài tài liệu đã được đặt trên bàn.'],
      ['A man is pouring coffee into a cup.', 'Một người đàn ông đang rót cà phê vào cốc.'],
      ['The chairs are arranged around a table.', 'Những chiếc ghế được xếp quanh một cái bàn.'],
      ['Two colleagues are looking at a monitor.', 'Hai đồng nghiệp đang nhìn vào màn hình.'],
      ['A plant is being watered near the window.', 'Một chậu cây đang được tưới gần cửa sổ.'],
      ['The printer is out of paper.', 'Máy in đã hết giấy.'],
      ['Files are stacked on a shelf.', 'Các tập hồ sơ được chồng lên kệ.'],
      ['A worker is hanging a picture on the wall.', 'Một nhân viên đang treo bức tranh lên tường.'],
      ['The lights have been turned off in the meeting room.', 'Đèn trong phòng họp đã được tắt.'],
    ],
  },
  {
    id: 'l2', title: 'Hỏi đáp nhanh nơi công sở', part: 'Part 2 · Hỏi – đáp', scene: '💬', accent: 'uk', level: 1,
    s: [
      ['Where should I put these boxes?', 'Tôi nên để những thùng này ở đâu?'],
      ['Just leave them next to the copier.', 'Cứ để chúng cạnh máy photocopy.'],
      ['When does the training session start?', 'Khi nào buổi đào tạo bắt đầu?'],
      ['It has been moved to two o’clock.', 'Nó đã được dời sang hai giờ.'],
      ['Who is in charge of the new project?', 'Ai phụ trách dự án mới?'],
      ['I think Ms. Rivera is leading it.', 'Tôi nghĩ cô Rivera đang dẫn dắt nó.'],
      ['Why was the delivery delayed?', 'Tại sao việc giao hàng bị trễ?'],
      ['Because of the heavy snow last night.', 'Vì trận tuyết lớn tối qua.'],
      ['Would you like me to book a taxi for you?', 'Bạn có muốn tôi đặt taxi cho bạn không?'],
      ['Thanks, but I will take the subway.', 'Cảm ơn, nhưng tôi sẽ đi tàu điện ngầm.'],
    ],
  },
  {
    id: 'l3', title: 'Đặt bàn nhà hàng', part: 'Part 3 · Hội thoại', scene: '🍝', accent: 'au', level: 1,
    s: [
      ['Hello, I would like to reserve a table for Friday evening.', 'Xin chào, tôi muốn đặt bàn vào tối thứ Sáu.'],
      ['Certainly. How many people will be in your party?', 'Chắc chắn rồi. Nhóm của bạn có bao nhiêu người?'],
      ['There will be six of us, including two children.', 'Chúng tôi có sáu người, gồm cả hai trẻ em.'],
      ['We have a table by the window at seven thirty.', 'Chúng tôi có một bàn cạnh cửa sổ lúc bảy giờ ba mươi.'],
      ['That sounds perfect. Do you have a vegetarian menu?', 'Nghe thật tuyệt. Nhà hàng có thực đơn chay không?'],
      ['Yes, and our chef can prepare gluten-free dishes as well.', 'Có, và đầu bếp cũng có thể làm món không chứa gluten.'],
      ['Could I have your name and phone number, please?', 'Cho tôi xin tên và số điện thoại của bạn được không?'],
      ['It is Daniel Ward, and my number is 555-0142.', 'Tôi là Daniel Ward, số của tôi là 555-0142.'],
      ['We will send you a confirmation message shortly.', 'Chúng tôi sẽ gửi tin nhắn xác nhận cho bạn ngay.'],
      ['Please call us if your plans change.', 'Vui lòng gọi cho chúng tôi nếu kế hoạch của bạn thay đổi.'],
    ],
  },
  {
    id: 'l4', title: 'Thông báo ở sân bay', part: 'Part 4 · Bài nói', scene: '✈️', accent: 'uk', level: 2,
    s: [
      ['Attention, passengers on flight 208 to Singapore.', 'Hành khách chuyến bay 208 đi Singapore xin chú ý.'],
      ['Your departure gate has been changed to gate fourteen.', 'Cửa khởi hành của quý khách đã được đổi sang cửa số mười bốn.'],
      ['Boarding will begin in approximately twenty minutes.', 'Việc lên máy bay sẽ bắt đầu sau khoảng hai mươi phút.'],
      ['Passengers with small children may board first.', 'Hành khách có con nhỏ có thể lên trước.'],
      ['Please have your boarding pass and passport ready.', 'Vui lòng chuẩn bị sẵn thẻ lên máy bay và hộ chiếu.'],
      ['Each passenger is allowed one carry-on bag.', 'Mỗi hành khách được mang một túi xách tay.'],
      ['Larger items must be checked at the counter.', 'Đồ lớn hơn phải ký gửi tại quầy.'],
      ['We apologize for any inconvenience this may cause.', 'Chúng tôi xin lỗi vì mọi bất tiện có thể gây ra.'],
      ['Free snacks are available near the information desk.', 'Đồ ăn nhẹ miễn phí có ở gần quầy thông tin.'],
      ['Thank you for flying with Blue Sky Airlines.', 'Cảm ơn quý khách đã bay cùng Blue Sky Airlines.'],
    ],
  },
  {
    id: 'l5', title: 'Phỏng vấn xin việc', part: 'Part 3 · Hội thoại', scene: '🤝', accent: 'us', level: 2,
    s: [
      ['Thank you for coming in for the interview today.', 'Cảm ơn bạn đã đến buổi phỏng vấn hôm nay.'],
      ['Could you tell me about your previous experience?', 'Bạn có thể kể về kinh nghiệm trước đây của mình không?'],
      ['I worked as a sales assistant for three years.', 'Tôi đã làm trợ lý bán hàng trong ba năm.'],
      ['I was responsible for handling customer complaints.', 'Tôi chịu trách nhiệm xử lý các khiếu nại của khách hàng.'],
      ['Why are you interested in this position?', 'Tại sao bạn quan tâm đến vị trí này?'],
      ['I want to develop my skills in marketing.', 'Tôi muốn phát triển kỹ năng về tiếp thị.'],
      ['Are you comfortable working on weekends?', 'Bạn có thoải mái làm việc vào cuối tuần không?'],
      ['Yes, as long as the schedule is shared in advance.', 'Có, miễn là lịch được thông báo trước.'],
      ['We will contact all applicants by the end of next week.', 'Chúng tôi sẽ liên hệ tất cả ứng viên trước cuối tuần sau.'],
      ['Please feel free to email me if you have any questions.', 'Cứ thoải mái gửi email cho tôi nếu bạn có câu hỏi.'],
    ],
  },
  {
    id: 'l6', title: 'Mua sắm & đổi trả', part: 'Part 3 · Hội thoại', scene: '🛍️', accent: 'au', level: 2,
    s: [
      ['I bought this jacket last week, but it is too small.', 'Tôi mua chiếc áo khoác này tuần trước nhưng nó quá nhỏ.'],
      ['Do you have your receipt with you?', 'Bạn có mang theo hóa đơn không?'],
      ['Yes, here it is. I paid by credit card.', 'Có, đây ạ. Tôi đã thanh toán bằng thẻ tín dụng.'],
      ['Would you prefer an exchange or a refund?', 'Bạn muốn đổi hàng hay hoàn tiền?'],
      ['I would like the same jacket in a larger size.', 'Tôi muốn chiếc áo khoác giống vậy nhưng cỡ lớn hơn.'],
      ['I am afraid that size is out of stock at the moment.', 'Tôi e là cỡ đó hiện đang hết hàng.'],
      ['We can order one from our other branch.', 'Chúng tôi có thể đặt một chiếc từ chi nhánh khác.'],
      ['It should arrive within three business days.', 'Nó sẽ đến trong vòng ba ngày làm việc.'],
      ['Shall we deliver it to your home address?', 'Chúng tôi giao đến địa chỉ nhà bạn nhé?'],
      ['That would be great. Thank you for your help.', 'Vậy thì tuyệt quá. Cảm ơn bạn đã giúp.'],
    ],
  },
  {
    id: 'l7', title: 'Cuộc họp ngân sách', part: 'Part 3 · Hội thoại', scene: '📊', accent: 'us', level: 2,
    s: [
      ['Let us review the marketing budget for next quarter.', 'Hãy cùng xem lại ngân sách tiếp thị cho quý tới.'],
      ['Our advertising costs increased by fifteen percent.', 'Chi phí quảng cáo của chúng ta tăng mười lăm phần trăm.'],
      ['Most of the money was spent on online campaigns.', 'Phần lớn tiền được chi cho các chiến dịch trực tuyến.'],
      ['The results were better than we had expected.', 'Kết quả tốt hơn chúng ta đã kỳ vọng.'],
      ['However, the trade show was not very profitable.', 'Tuy nhiên, hội chợ thương mại không mang lại nhiều lợi nhuận.'],
      ['I suggest that we reduce spending on printed materials.', 'Tôi đề xuất giảm chi tiêu cho tài liệu in ấn.'],
      ['We could invest more in social media instead.', 'Thay vào đó chúng ta có thể đầu tư nhiều hơn vào mạng xã hội.'],
      ['Can you prepare a detailed report by Thursday?', 'Bạn có thể chuẩn bị báo cáo chi tiết trước thứ Năm không?'],
      ['Sure, I will send it to everyone on the team.', 'Chắc chắn, tôi sẽ gửi cho mọi người trong nhóm.'],
      ['Then we can make a final decision on Friday.', 'Sau đó chúng ta có thể ra quyết định cuối cùng vào thứ Sáu.'],
    ],
  },
  {
    id: 'l8', title: 'Lời nhắn điện thoại', part: 'Part 4 · Bài nói', scene: '📞', accent: 'uk', level: 2,
    s: [
      ['Hi, this is Laura calling from Greenfield Printing.', 'Xin chào, tôi là Laura gọi từ Greenfield Printing.'],
      ['I am calling about the brochures you ordered.', 'Tôi gọi về đơn tờ rơi bạn đã đặt.'],
      ['Unfortunately, one of our machines broke down yesterday.', 'Không may là một trong các máy của chúng tôi bị hỏng hôm qua.'],
      ['As a result, your order will be two days late.', 'Do đó, đơn hàng của bạn sẽ trễ hai ngày.'],
      ['We understand that this may affect your event.', 'Chúng tôi hiểu rằng điều này có thể ảnh hưởng đến sự kiện của bạn.'],
      ['To make up for it, we will offer a ten percent discount.', 'Để bù lại, chúng tôi sẽ giảm giá mười phần trăm.'],
      ['We can also deliver the brochures free of charge.', 'Chúng tôi cũng có thể giao tờ rơi miễn phí.'],
      ['Please let me know if this arrangement works for you.', 'Vui lòng cho tôi biết sắp xếp này có phù hợp với bạn không.'],
      ['You can reach me at extension two five three.', 'Bạn có thể liên lạc tôi qua số máy lẻ hai năm ba.'],
      ['Again, I am very sorry for the delay.', 'Một lần nữa, tôi rất xin lỗi vì sự chậm trễ.'],
    ],
  },
  {
    id: 'l9', title: 'Nhận phòng khách sạn', part: 'Part 3 · Hội thoại', scene: '🏨', accent: 'au', level: 3,
    s: [
      ['Good evening. I have a reservation under the name Chen.', 'Chào buổi tối. Tôi đã đặt phòng dưới tên Chen.'],
      ['Welcome, Mr. Chen. You are staying with us for three nights.', 'Chào mừng ông Chen. Ông sẽ ở với chúng tôi ba đêm.'],
      ['Breakfast is served from six thirty to ten in the lobby restaurant.', 'Bữa sáng phục vụ từ sáu giờ rưỡi đến mười giờ tại nhà hàng ở sảnh.'],
      ['Is there a fitness center that guests can use for free?', 'Có phòng tập thể dục mà khách được dùng miễn phí không?'],
      ['Yes, it is on the fifth floor and opens twenty-four hours a day.', 'Có, nó ở tầng năm và mở cửa hai mươi bốn giờ mỗi ngày.'],
      ['I also need to print some documents for a meeting tomorrow.', 'Tôi cũng cần in vài tài liệu cho cuộc họp ngày mai.'],
      ['Our business center provides printing and scanning services.', 'Trung tâm doanh nhân của chúng tôi có dịch vụ in và quét.'],
      ['Would it be possible to check out a little later on Sunday?', 'Liệu tôi có thể trả phòng muộn hơn một chút vào Chủ nhật không?'],
      ['Late checkout is available until one o’clock for a small fee.', 'Có thể trả phòng muộn đến một giờ với một khoản phí nhỏ.'],
      ['Here is your key card. Your room is on the eighth floor.', 'Đây là thẻ phòng của ông. Phòng ông ở tầng tám.'],
    ],
  },
  {
    id: 'l10', title: 'Bản tin kinh doanh', part: 'Part 4 · Bài nói', scene: '📰', accent: 'us', level: 3,
    s: [
      ['In business news, Harbor Electronics has announced a major expansion.', 'Tin kinh doanh: Harbor Electronics vừa công bố một đợt mở rộng lớn.'],
      ['The company will open a new factory in the northern region.', 'Công ty sẽ mở một nhà máy mới ở khu vực phía bắc.'],
      ['The project is expected to create around eight hundred jobs.', 'Dự án dự kiến tạo ra khoảng tám trăm việc làm.'],
      ['Construction will begin in March and finish by the end of next year.', 'Việc xây dựng bắt đầu vào tháng Ba và hoàn thành vào cuối năm sau.'],
      ['Local officials welcomed the news at a press conference on Monday.', 'Các quan chức địa phương đã hoan nghênh tin này tại họp báo hôm thứ Hai.'],
      ['Harbor’s profits have risen steadily over the past five years.', 'Lợi nhuận của Harbor đã tăng đều trong năm năm qua.'],
      ['Analysts say the demand for its products continues to grow.', 'Các nhà phân tích cho biết nhu cầu về sản phẩm của hãng tiếp tục tăng.'],
      ['The company also plans to hire engineers from nearby universities.', 'Công ty cũng dự định tuyển kỹ sư từ các trường đại học gần đó.'],
      ['Applications will be accepted through its website starting next month.', 'Hồ sơ sẽ được nhận qua trang web của hãng từ tháng sau.'],
      ['Stay tuned for the weather report after this short break.', 'Hãy tiếp tục theo dõi bản tin thời tiết sau giờ nghỉ ngắn này.'],
    ],
  },
  {
    id: 'l11', title: 'Hướng dẫn nhân viên mới', part: 'Part 4 · Bài nói', scene: '🧑‍💼', accent: 'uk', level: 3,
    s: [
      ['Welcome to your first day at Maple Insurance.', 'Chào mừng bạn đến ngày đầu tiên tại Maple Insurance.'],
      ['This morning, we will give you a tour of the building.', 'Sáng nay, chúng tôi sẽ đưa bạn đi tham quan tòa nhà.'],
      ['After that, you will receive your laptop and identification badge.', 'Sau đó, bạn sẽ nhận laptop và thẻ nhân viên.'],
      ['Please wear your badge at all times while you are in the office.', 'Vui lòng luôn đeo thẻ khi bạn ở trong văn phòng.'],
      ['Lunch will be provided in the staff cafeteria on the second floor.', 'Bữa trưa sẽ được phục vụ tại căng tin nhân viên ở tầng hai.'],
      ['In the afternoon, your supervisor will explain your responsibilities.', 'Buổi chiều, người giám sát sẽ giải thích trách nhiệm của bạn.'],
      ['If you have any questions, the human resources team is happy to help.', 'Nếu có câu hỏi, đội nhân sự luôn sẵn lòng hỗ trợ.'],
      ['Remember to complete the online safety course by Friday.', 'Nhớ hoàn thành khóa học an toàn trực tuyến trước thứ Sáu.'],
      ['It takes about forty minutes and is required for all employees.', 'Khóa học mất khoảng bốn mươi phút và bắt buộc với mọi nhân viên.'],
      ['We hope you enjoy working with us.', 'Chúng tôi hy vọng bạn sẽ thích làm việc cùng chúng tôi.'],
    ],
  },
  {
    id: 'l12', title: 'Sự cố kỹ thuật', part: 'Part 3 · Hội thoại', scene: '🛠️', accent: 'au', level: 3,
    s: [
      ['The projector in conference room B is not working again.', 'Máy chiếu ở phòng họp B lại không hoạt động.'],
      ['Have you tried restarting it and checking the cable?', 'Bạn đã thử khởi động lại và kiểm tra dây cáp chưa?'],
      ['Yes, but the screen still says there is no signal.', 'Rồi, nhưng màn hình vẫn báo không có tín hiệu.'],
      ['The clients are arriving in fifteen minutes.', 'Khách hàng sẽ đến trong mười lăm phút nữa.'],
      ['Why don’t we move the meeting to room C instead?', 'Sao chúng ta không chuyển cuộc họp sang phòng C?'],
      ['Good idea. I will ask the receptionist to direct them there.', 'Ý hay. Tôi sẽ nhờ lễ tân hướng dẫn họ đến đó.'],
      ['I will also contact the maintenance department.', 'Tôi cũng sẽ liên hệ bộ phận bảo trì.'],
      ['They should replace that projector as soon as possible.', 'Họ nên thay máy chiếu đó càng sớm càng tốt.'],
      ['It has broken down three times this month.', 'Nó đã hỏng ba lần trong tháng này.'],
      ['Let us bring the printed slides just in case.', 'Hãy mang theo bản slide in sẵn để phòng hờ.'],
    ],
  },
]

const STOP = new Set('a an the is are am was were be been being to of in on at for by with and or but if as it its this that these those i you he she we they me him her us them my your our their do does did have has had will would can could should may might shall not no so than then there here from into up out about just very please'.split(' '))

// Pick key words to blank out (content words, longest first, max 3)
export function blanksFor(sentence) {
  const tokens = sentence.split(/\s+/)
  const cands = tokens
    .map((t, i) => ({ i, w: t.replace(/[^A-Za-z0-9'’-]/g, '') }))
    .filter(({ w }) => w.length > 2 && !STOP.has(w.toLowerCase()))
    .sort((a, b) => b.w.length - a.w.length)
  const n = tokens.length > 9 ? 3 : 2
  return new Set(cands.slice(0, n).map((c) => c.i))
}

export const norm = (s) => s.toLowerCase().replace(/[’]/g, "'").replace(/[^a-z0-9'\s-]/g, '').replace(/\s+/g, ' ').trim()
