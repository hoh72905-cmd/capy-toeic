// TOEIC word families. words: [word, part of speech, Vietnamese meaning]
// ex: example sentences that use clauses, [English, Vietnamese]
export const FAMILIES = [
  {
    id: 'employ', topic: 'Nhân sự', ipa: '/ɪmˈplɔɪ/',
    words: [['employ', 'v', 'tuyển dụng, thuê'], ['employee', 'n', 'nhân viên'], ['employer', 'n', 'chủ lao động'], ['employment', 'n', 'việc làm, sự tuyển dụng'], ['unemployed', 'adj', 'thất nghiệp']],
    syn: ['hire', 'recruit'], ant: ['dismiss', 'fire', 'lay off'],
    ex: [['The firm, which employs over 500 people, is opening a new branch.', 'Công ty, nơi tuyển dụng hơn 500 người, đang mở một chi nhánh mới.'],
      ['Employees who work overtime will receive extra pay.', 'Những nhân viên làm thêm giờ sẽ nhận thêm lương.']],
  },
  {
    id: 'apply', topic: 'Nhân sự', ipa: '/əˈplaɪ/',
    words: [['apply', 'v', 'nộp đơn; áp dụng'], ['applicant', 'n', 'người nộp đơn, ứng viên'], ['application', 'n', 'đơn xin; sự áp dụng; ứng dụng'], ['applicable', 'adj', 'có thể áp dụng']],
    syn: ['submit', 'request', 'candidate'], ant: ['withdraw'],
    ex: [['Applicants who submit their forms by Friday will be interviewed next week.', 'Những ứng viên nộp đơn trước thứ Sáu sẽ được phỏng vấn vào tuần sau.'],
      ['The new rule is applicable to all staff, regardless of their position.', 'Quy định mới áp dụng cho mọi nhân viên, bất kể chức vụ.']],
  },
  {
    id: 'qualify', topic: 'Nhân sự', ipa: '/ˈkwɒlɪfaɪ/',
    words: [['qualify', 'v', 'đủ điều kiện'], ['qualification', 'n', 'bằng cấp, trình độ'], ['qualified', 'adj', 'đủ tiêu chuẩn, có năng lực'], ['unqualified', 'adj', 'không đủ tiêu chuẩn']],
    syn: ['eligible', 'competent'], ant: ['unqualified', 'incompetent'],
    ex: [['Only candidates who have three years of experience qualify for the position.', 'Chỉ những ứng viên có ba năm kinh nghiệm mới đủ điều kiện cho vị trí này.'],
      ['We are looking for a qualified engineer who can lead the team.', 'Chúng tôi đang tìm một kỹ sư có năng lực, người có thể dẫn dắt nhóm.']],
  },
  {
    id: 'manage', topic: 'Văn phòng', ipa: '/ˈmænɪdʒ/',
    words: [['manage', 'v', 'quản lý; xoay xở được'], ['manager', 'n', 'người quản lý'], ['management', 'n', 'sự quản lý; ban quản lý'], ['managerial', 'adj', 'thuộc về quản lý'], ['manageable', 'adj', 'có thể kiểm soát được']],
    syn: ['supervise', 'oversee', 'run'], ant: ['neglect', 'mismanage'],
    ex: [['The manager who oversees the project will retire next month.', 'Người quản lý giám sát dự án sẽ nghỉ hưu vào tháng tới.'],
      ['Although the workload was heavy, the team managed to finish on time.', 'Mặc dù khối lượng công việc nặng, cả nhóm vẫn xoay xở hoàn thành đúng hạn.']],
  },
  {
    id: 'produce', topic: 'Sản xuất', ipa: '/prəˈdjuːs/',
    words: [['produce', 'v', 'sản xuất'], ['product', 'n', 'sản phẩm'], ['production', 'n', 'sự sản xuất'], ['productive', 'adj', 'năng suất, hiệu quả'], ['productivity', 'n', 'năng suất']],
    syn: ['manufacture', 'make', 'create'], ant: ['consume', 'unproductive'],
    ex: [['The factory, which produces car parts, has increased its productivity by 20%.', 'Nhà máy sản xuất linh kiện ô tô đã tăng năng suất thêm 20%.'],
      ['Production will stop while the machines are being repaired.', 'Việc sản xuất sẽ dừng lại trong khi máy móc đang được sửa chữa.']],
  },
  {
    id: 'compete', topic: 'Kinh doanh', ipa: '/kəmˈpiːt/',
    words: [['compete', 'v', 'cạnh tranh'], ['competition', 'n', 'sự cạnh tranh; cuộc thi'], ['competitor', 'n', 'đối thủ cạnh tranh'], ['competitive', 'adj', 'cạnh tranh, có sức cạnh tranh'], ['competitively', 'adv', 'một cách cạnh tranh']],
    syn: ['rival', 'contend'], ant: ['cooperate', 'collaborate'],
    ex: [['Our prices are competitive because we buy materials directly from suppliers.', 'Giá của chúng tôi cạnh tranh vì chúng tôi mua nguyên liệu trực tiếp từ nhà cung cấp.'],
      ['If we want to compete with larger firms, we must improve our service.', 'Nếu muốn cạnh tranh với các công ty lớn hơn, chúng ta phải cải thiện dịch vụ.']],
  },
  {
    id: 'succeed', topic: 'Kinh doanh', ipa: '/səkˈsiːd/',
    words: [['succeed', 'v', 'thành công; kế nhiệm'], ['success', 'n', 'sự thành công'], ['successful', 'adj', 'thành công'], ['successfully', 'adv', 'một cách thành công'], ['successor', 'n', 'người kế nhiệm']],
    syn: ['achieve', 'accomplish', 'thrive'], ant: ['fail', 'failure'],
    ex: [['The campaign was so successful that sales doubled within a month.', 'Chiến dịch thành công đến mức doanh số tăng gấp đôi trong vòng một tháng.'],
      ['Ms. Lee, who will succeed Mr. Park as director, starts on Monday.', 'Bà Lee, người sẽ kế nhiệm ông Park làm giám đốc, bắt đầu vào thứ Hai.']],
  },
  {
    id: 'decide', topic: 'Văn phòng', ipa: '/dɪˈsaɪd/',
    words: [['decide', 'v', 'quyết định'], ['decision', 'n', 'quyết định'], ['decisive', 'adj', 'quyết đoán; mang tính quyết định'], ['decisively', 'adv', 'một cách dứt khoát']],
    syn: ['determine', 'resolve', 'conclude'], ant: ['hesitate', 'indecisive'],
    ex: [['The board will make a final decision after it reviews the budget.', 'Hội đồng sẽ đưa ra quyết định cuối cùng sau khi xem xét ngân sách.'],
      ['She acted decisively when the supplier cancelled the order.', 'Cô ấy hành động dứt khoát khi nhà cung cấp hủy đơn hàng.']],
  },
  {
    id: 'inform', topic: 'Văn phòng', ipa: '/ɪnˈfɔːm/',
    words: [['inform', 'v', 'thông báo'], ['information', 'n', 'thông tin'], ['informative', 'adj', 'nhiều thông tin, bổ ích'], ['informed', 'adj', 'có hiểu biết, nắm thông tin']],
    syn: ['notify', 'advise', 'tell'], ant: ['conceal', 'withhold'],
    ex: [['Please inform us if you cannot attend the meeting that was scheduled for Tuesday.', 'Vui lòng báo cho chúng tôi nếu bạn không thể tham dự cuộc họp đã lên lịch vào thứ Ba.'],
      ['The workshop was so informative that many attendees asked for a second session.', 'Buổi hội thảo bổ ích đến mức nhiều người tham dự yêu cầu thêm một buổi nữa.']],
  },
  {
    id: 'require', topic: 'Văn phòng', ipa: '/rɪˈkwaɪə/',
    words: [['require', 'v', 'yêu cầu, đòi hỏi'], ['requirement', 'n', 'yêu cầu, điều kiện'], ['required', 'adj', 'bắt buộc']],
    syn: ['need', 'demand', 'mandatory'], ant: ['optional'],
    ex: [['All visitors are required to sign in when they enter the building.', 'Tất cả khách đến đều phải đăng ký khi vào tòa nhà.'],
      ['Applicants who do not meet the requirements will not be contacted.', 'Những ứng viên không đáp ứng yêu cầu sẽ không được liên hệ.']],
  },
  {
    id: 'finance', topic: 'Tài chính', ipa: '/ˈfaɪnæns/',
    words: [['finance', 'n/v', 'tài chính; cấp vốn'], ['financial', 'adj', 'thuộc tài chính'], ['financially', 'adv', 'về mặt tài chính'], ['financing', 'n', 'nguồn vốn, sự cấp vốn']],
    syn: ['fund', 'monetary', 'fiscal'], ant: ['defund'],
    ex: [['The project was financed by a bank that specializes in small businesses.', 'Dự án được cấp vốn bởi một ngân hàng chuyên về doanh nghiệp nhỏ.'],
      ['Our financial report shows that costs have risen since last year.', 'Báo cáo tài chính cho thấy chi phí đã tăng kể từ năm ngoái.']],
  },
  {
    id: 'economy', topic: 'Tài chính', ipa: '/ɪˈkɒnəmi/',
    words: [['economy', 'n', 'nền kinh tế'], ['economic', 'adj', 'thuộc kinh tế'], ['economical', 'adj', 'tiết kiệm'], ['economist', 'n', 'nhà kinh tế học'], ['economize', 'v', 'tiết kiệm, giảm chi']],
    syn: ['thrifty', 'cost-effective'], ant: ['wasteful', 'extravagant'],
    ex: [['Economists predict that the economy will grow slowly this year.', 'Các nhà kinh tế dự đoán nền kinh tế sẽ tăng trưởng chậm trong năm nay.'],
      ['This model is more economical because it uses less fuel.', 'Mẫu này tiết kiệm hơn vì nó dùng ít nhiên liệu hơn.']],
  },
  {
    id: 'invest', topic: 'Tài chính', ipa: '/ɪnˈvest/',
    words: [['invest', 'v', 'đầu tư'], ['investment', 'n', 'khoản đầu tư'], ['investor', 'n', 'nhà đầu tư']],
    syn: ['fund', 'finance', 'put money into'], ant: ['divest', 'withdraw'],
    ex: [['Investors who bought shares early have made large profits.', 'Những nhà đầu tư mua cổ phiếu sớm đã thu được lợi nhuận lớn.'],
      ['The company will invest in new software so that staff can work remotely.', 'Công ty sẽ đầu tư vào phần mềm mới để nhân viên có thể làm việc từ xa.']],
  },
  {
    id: 'profit', topic: 'Tài chính', ipa: '/ˈprɒfɪt/',
    words: [['profit', 'n', 'lợi nhuận'], ['profitable', 'adj', 'có lãi'], ['profitability', 'n', 'khả năng sinh lời'], ['profitably', 'adv', 'một cách có lãi']],
    syn: ['gain', 'earnings', 'lucrative'], ant: ['loss', 'unprofitable'],
    ex: [['The store became profitable after it moved to a busier street.', 'Cửa hàng bắt đầu có lãi sau khi chuyển đến một con phố đông đúc hơn.'],
      ['Profits fell because the cost of materials increased.', 'Lợi nhuận giảm vì chi phí nguyên vật liệu tăng.']],
  },
  {
    id: 'account', topic: 'Tài chính', ipa: '/əˈkaʊnt/',
    words: [['account', 'n', 'tài khoản; bản kê'], ['accountant', 'n', 'kế toán viên'], ['accounting', 'n', 'ngành/công việc kế toán'], ['accountable', 'adj', 'chịu trách nhiệm']],
    syn: ['responsible', 'answerable'], ant: ['unaccountable'],
    ex: [['The accountant who prepared the report found several errors.', 'Kế toán viên lập báo cáo đã phát hiện vài lỗi.'],
      ['Managers are accountable for the budgets that they approve.', 'Các quản lý chịu trách nhiệm về những ngân sách mà họ phê duyệt.']],
  },
  {
    id: 'advertise', topic: 'Marketing', ipa: '/ˈædvətaɪz/',
    words: [['advertise', 'v', 'quảng cáo'], ['advertisement', 'n', 'mẩu quảng cáo'], ['advertiser', 'n', 'nhà quảng cáo'], ['advertising', 'n', 'ngành quảng cáo']],
    syn: ['promote', 'publicize', 'market'], ant: ['conceal'],
    ex: [['The advertisement that appeared in Sunday’s paper attracted many customers.', 'Mẩu quảng cáo đăng trên báo Chủ nhật đã thu hút nhiều khách hàng.'],
      ['We advertise online because it is cheaper than television.', 'Chúng tôi quảng cáo trực tuyến vì rẻ hơn truyền hình.']],
  },
  {
    id: 'promote', topic: 'Marketing', ipa: '/prəˈməʊt/',
    words: [['promote', 'v', 'quảng bá; thăng chức'], ['promotion', 'n', 'sự thăng chức; khuyến mãi'], ['promotional', 'adj', 'mang tính quảng bá']],
    syn: ['advance', 'upgrade', 'publicize'], ant: ['demote'],
    ex: [['Mr. Tan was promoted to sales director after he exceeded his targets.', 'Ông Tan được thăng chức giám đốc kinh doanh sau khi vượt chỉ tiêu.'],
      ['Customers who sign up today will receive a promotional discount.', 'Khách hàng đăng ký hôm nay sẽ nhận ưu đãi khuyến mãi.']],
  },
  {
    id: 'market', topic: 'Marketing', ipa: '/ˈmɑːkɪt/',
    words: [['market', 'n/v', 'thị trường; tiếp thị'], ['marketing', 'n', 'tiếp thị'], ['marketable', 'adj', 'dễ bán'], ['marketplace', 'n', 'thị trường, chợ']],
    syn: ['sell', 'promote'], ant: ['unmarketable'],
    ex: [['The marketing team, which has five members, is planning a new campaign.', 'Nhóm tiếp thị gồm năm thành viên đang lên kế hoạch cho một chiến dịch mới.'],
      ['The product is marketed to young people who travel often.', 'Sản phẩm được tiếp thị đến những người trẻ thường xuyên đi du lịch.']],
  },
  {
    id: 'negotiate', topic: 'Hợp đồng', ipa: '/nɪˈɡəʊʃieɪt/',
    words: [['negotiate', 'v', 'đàm phán'], ['negotiation', 'n', 'cuộc đàm phán'], ['negotiator', 'n', 'người đàm phán'], ['negotiable', 'adj', 'có thể thương lượng']],
    syn: ['bargain', 'discuss', 'arrange'], ant: ['non-negotiable', 'fixed'],
    ex: [['The salary is negotiable, depending on the experience that you have.', 'Mức lương có thể thương lượng, tùy vào kinh nghiệm của bạn.'],
      ['Negotiations continued until both sides agreed on the price.', 'Cuộc đàm phán tiếp tục cho đến khi hai bên thống nhất được giá.']],
  },
  {
    id: 'agree', topic: 'Hợp đồng', ipa: '/əˈɡriː/',
    words: [['agree', 'v', 'đồng ý'], ['agreement', 'n', 'thỏa thuận, hợp đồng'], ['agreeable', 'adj', 'dễ chịu; có thể chấp nhận'], ['disagree', 'v', 'không đồng ý']],
    syn: ['consent', 'accept', 'approve'], ant: ['disagree', 'refuse', 'reject'],
    ex: [['Both companies signed an agreement that lasts for three years.', 'Hai công ty đã ký một thỏa thuận kéo dài ba năm.'],
      ['If the client agrees to the terms, we will start next week.', 'Nếu khách hàng đồng ý các điều khoản, chúng ta sẽ bắt đầu vào tuần sau.']],
  },
  {
    id: 'expire', topic: 'Hợp đồng', ipa: '/ɪkˈspaɪə/',
    words: [['expire', 'v', 'hết hạn'], ['expiration', 'n', 'sự hết hạn'], ['expired', 'adj', 'đã hết hạn']],
    syn: ['end', 'lapse', 'run out'], ant: ['renew', 'extend'],
    ex: [['Your membership will expire unless you renew it before May 1.', 'Thẻ thành viên của bạn sẽ hết hạn trừ khi bạn gia hạn trước ngày 1/5.'],
      ['Please check the expiration date before you use the coupon.', 'Vui lòng kiểm tra ngày hết hạn trước khi dùng phiếu giảm giá.']],
  },
  {
    id: 'attend', topic: 'Hội họp', ipa: '/əˈtend/',
    words: [['attend', 'v', 'tham dự'], ['attendance', 'n', 'sự tham dự; số người dự'], ['attendee', 'n', 'người tham dự'], ['attendant', 'n', 'người phục vụ'], ['attentive', 'adj', 'chu đáo, chú ý']],
    syn: ['participate', 'be present', 'join'], ant: ['miss', 'skip', 'absent'],
    ex: [['Attendees who register early will receive a free lunch.', 'Những người tham dự đăng ký sớm sẽ được tặng bữa trưa miễn phí.'],
      ['Attendance at the safety training is mandatory for all workers.', 'Việc tham dự buổi đào tạo an toàn là bắt buộc với mọi công nhân.']],
  },
  {
    id: 'present', topic: 'Hội họp', ipa: '/prɪˈzent/',
    words: [['present', 'v', 'trình bày; trao tặng'], ['presentation', 'n', 'bài thuyết trình'], ['presenter', 'n', 'người thuyết trình'], ['presence', 'n', 'sự có mặt']],
    syn: ['show', 'introduce', 'demonstrate'], ant: ['absence', 'conceal'],
    ex: [['The presentation that Ms. Kim gave impressed the investors.', 'Bài thuyết trình mà cô Kim trình bày đã gây ấn tượng với các nhà đầu tư.'],
      ['Your presence is requested at the annual dinner, which will be held on Friday.', 'Sự có mặt của bạn được mong đợi tại bữa tối thường niên, tổ chức vào thứ Sáu.']],
  },
  {
    id: 'schedule', topic: 'Hội họp', ipa: '/ˈʃedjuːl/',
    words: [['schedule', 'n/v', 'lịch trình; lên lịch'], ['scheduled', 'adj', 'đã lên lịch'], ['reschedule', 'v', 'dời lịch']],
    syn: ['plan', 'timetable', 'arrange'], ant: ['cancel'],
    ex: [['The meeting has been rescheduled because the director is traveling.', 'Cuộc họp đã được dời lịch vì giám đốc đang đi công tác.'],
      ['The train is scheduled to arrive at 9:15, but it may be late.', 'Tàu dự kiến đến lúc 9 giờ 15 nhưng có thể bị trễ.']],
  },
  {
    id: 'confirm', topic: 'Du lịch', ipa: '/kənˈfɜːm/',
    words: [['confirm', 'v', 'xác nhận'], ['confirmation', 'n', 'sự xác nhận'], ['confirmed', 'adj', 'đã xác nhận']],
    syn: ['verify', 'approve', 'validate'], ant: ['cancel', 'deny'],
    ex: [['You will receive a confirmation email once your payment is processed.', 'Bạn sẽ nhận email xác nhận khi thanh toán được xử lý.'],
      ['Please confirm whether you will join the tour that departs at noon.', 'Vui lòng xác nhận bạn có tham gia chuyến tham quan khởi hành lúc trưa hay không.']],
  },
  {
    id: 'reserve', topic: 'Du lịch', ipa: '/rɪˈzɜːv/',
    words: [['reserve', 'v', 'đặt trước; dành riêng'], ['reservation', 'n', 'sự đặt chỗ'], ['reserved', 'adj', 'đã được đặt; kín đáo']],
    syn: ['book', 'hold', 'save'], ant: ['cancel', 'release'],
    ex: [['I would like to make a reservation for four people who are arriving at 7.', 'Tôi muốn đặt bàn cho bốn người sẽ đến lúc 7 giờ.'],
      ['These seats are reserved for guests who have special passes.', 'Những ghế này dành riêng cho khách có thẻ đặc biệt.']],
  },
  {
    id: 'depart', topic: 'Du lịch', ipa: '/dɪˈpɑːt/',
    words: [['depart', 'v', 'khởi hành'], ['departure', 'n', 'sự khởi hành'], ['department', 'n', 'phòng ban (từ khác nghĩa)']],
    syn: ['leave', 'set off'], ant: ['arrive', 'arrival'],
    ex: [['The flight that departs at 6 a.m. is often fully booked.', 'Chuyến bay khởi hành lúc 6 giờ sáng thường kín chỗ.'],
      ['Passengers should arrive two hours before their departure time.', 'Hành khách nên đến hai tiếng trước giờ khởi hành.']],
  },
  {
    id: 'accommodate', topic: 'Du lịch', ipa: '/əˈkɒmədeɪt/',
    words: [['accommodate', 'v', 'chứa được; đáp ứng'], ['accommodation', 'n', 'chỗ ở'], ['accommodating', 'adj', 'dễ chiều, sẵn lòng giúp']],
    syn: ['house', 'lodge', 'hold'], ant: ['turn away'],
    ex: [['The hall can accommodate up to 300 guests, which makes it ideal for conferences.', 'Hội trường chứa được tới 300 khách, nên rất lý tưởng cho hội nghị.'],
      ['Accommodation is included in the price that you paid.', 'Chỗ ở đã bao gồm trong giá bạn đã trả.']],
  },
  {
    id: 'deliver', topic: 'Mua sắm', ipa: '/dɪˈlɪvə/',
    words: [['deliver', 'v', 'giao hàng; trình bày (bài nói)'], ['delivery', 'n', 'sự giao hàng'], ['deliverable', 'n', 'sản phẩm bàn giao']],
    syn: ['ship', 'dispatch', 'transport'], ant: ['collect', 'receive'],
    ex: [['Orders that are placed before noon will be delivered the same day.', 'Đơn hàng đặt trước buổi trưa sẽ được giao trong ngày.'],
      ['Delivery is free if you spend more than $50.', 'Miễn phí giao hàng nếu bạn chi hơn 50 đô.']],
  },
  {
    id: 'ship', topic: 'Mua sắm', ipa: '/ʃɪp/',
    words: [['ship', 'v', 'vận chuyển, gửi hàng'], ['shipment', 'n', 'lô hàng'], ['shipping', 'n', 'sự vận chuyển; phí vận chuyển']],
    syn: ['send', 'deliver', 'dispatch'], ant: ['receive'],
    ex: [['The shipment that we expected on Monday has been delayed.', 'Lô hàng chúng tôi chờ vào thứ Hai đã bị trì hoãn.'],
      ['Shipping costs depend on how heavy the package is.', 'Phí vận chuyển phụ thuộc vào gói hàng nặng bao nhiêu.']],
  },
  {
    id: 'purchase', topic: 'Mua sắm', ipa: '/ˈpɜːtʃəs/',
    words: [['purchase', 'v/n', 'mua; món hàng đã mua'], ['purchaser', 'n', 'người mua'], ['purchasing', 'n', 'bộ phận/việc thu mua']],
    syn: ['buy', 'acquire', 'procure'], ant: ['sell'],
    ex: [['Customers who purchase two items will get a third one free.', 'Khách hàng mua hai món sẽ được tặng món thứ ba.'],
      ['Keep your receipt in case you want to return the purchase.', 'Hãy giữ hóa đơn phòng khi bạn muốn trả lại món hàng.']],
  },
  {
    id: 'refund', topic: 'Mua sắm', ipa: '/ˈriːfʌnd/',
    words: [['refund', 'n/v', 'tiền hoàn lại; hoàn tiền'], ['refundable', 'adj', 'có thể hoàn tiền'], ['non-refundable', 'adj', 'không hoàn tiền']],
    syn: ['reimburse', 'repay', 'pay back'], ant: ['charge'],
    ex: [['You can get a full refund if you return the item within 30 days.', 'Bạn có thể được hoàn tiền toàn bộ nếu trả hàng trong vòng 30 ngày.'],
      ['The deposit, which is non-refundable, must be paid in advance.', 'Tiền đặt cọc, khoản không được hoàn lại, phải trả trước.']],
  },
  {
    id: 'complain', topic: 'Mua sắm', ipa: '/kəmˈpleɪn/',
    words: [['complain', 'v', 'phàn nàn'], ['complaint', 'n', 'lời phàn nàn, khiếu nại']],
    syn: ['grumble', 'object', 'protest'], ant: ['praise', 'compliment'],
    ex: [['Several guests complained that the room was too noisy.', 'Một vài khách phàn nàn rằng phòng quá ồn.'],
      ['Complaints that are sent by email are answered within 24 hours.', 'Các khiếu nại gửi qua email được phản hồi trong vòng 24 giờ.']],
  },
  {
    id: 'satisfy', topic: 'Mua sắm', ipa: '/ˈsætɪsfaɪ/',
    words: [['satisfy', 'v', 'làm hài lòng; đáp ứng'], ['satisfaction', 'n', 'sự hài lòng'], ['satisfied', 'adj', 'hài lòng (người)'], ['satisfactory', 'adj', 'đạt yêu cầu (vật)'], ['dissatisfied', 'adj', 'không hài lòng']],
    syn: ['please', 'content', 'fulfill'], ant: ['disappoint', 'dissatisfy'],
    ex: [['Customers who are not satisfied can return the product for free.', 'Khách hàng không hài lòng có thể trả lại sản phẩm miễn phí.'],
      ['The results were satisfactory, although there is room for improvement.', 'Kết quả đạt yêu cầu, mặc dù vẫn còn chỗ để cải thiện.']],
  },
  {
    id: 'maintain', topic: 'Sản xuất', ipa: '/meɪnˈteɪn/',
    words: [['maintain', 'v', 'duy trì; bảo trì'], ['maintenance', 'n', 'sự bảo trì']],
    syn: ['preserve', 'keep up', 'service'], ant: ['neglect', 'abandon'],
    ex: [['The elevator will be closed while maintenance work is carried out.', 'Thang máy sẽ đóng cửa trong khi công việc bảo trì được tiến hành.'],
      ['It is important to maintain good relationships with clients who order regularly.', 'Điều quan trọng là duy trì quan hệ tốt với những khách hàng đặt hàng thường xuyên.']],
  },
  {
    id: 'install', topic: 'Sản xuất', ipa: '/ɪnˈstɔːl/',
    words: [['install', 'v', 'lắp đặt, cài đặt'], ['installation', 'n', 'sự lắp đặt'], ['installment', 'n', 'khoản trả góp; phần (kỳ)']],
    syn: ['set up', 'put in', 'fit'], ant: ['remove', 'uninstall'],
    ex: [['The technician who installed the printer will return to check it.', 'Kỹ thuật viên đã lắp máy in sẽ quay lại kiểm tra.'],
      ['You can pay for the laptop in six monthly installments.', 'Bạn có thể trả góp chiếc laptop trong sáu tháng.']],
  },
  {
    id: 'operate', topic: 'Sản xuất', ipa: '/ˈɒpəreɪt/',
    words: [['operate', 'v', 'vận hành, hoạt động'], ['operation', 'n', 'sự vận hành; hoạt động'], ['operational', 'adj', 'đang hoạt động'], ['operator', 'n', 'người vận hành; tổng đài viên']],
    syn: ['run', 'function', 'work'], ant: ['shut down'],
    ex: [['Only staff who have been trained may operate this machine.', 'Chỉ nhân viên đã được đào tạo mới được vận hành máy này.'],
      ['The new branch will be fully operational by the end of March.', 'Chi nhánh mới sẽ đi vào hoạt động đầy đủ vào cuối tháng Ba.']],
  },
  {
    id: 'efficient', topic: 'Văn phòng', ipa: '/ɪˈfɪʃnt/',
    words: [['efficient', 'adj', 'hiệu quả, năng suất'], ['efficiency', 'n', 'sự hiệu quả'], ['efficiently', 'adv', 'một cách hiệu quả'], ['inefficient', 'adj', 'kém hiệu quả']],
    syn: ['effective', 'productive', 'competent'], ant: ['inefficient', 'wasteful'],
    ex: [['The new system, which was installed last month, has improved efficiency.', 'Hệ thống mới, được lắp đặt tháng trước, đã cải thiện hiệu quả.'],
      ['If we work more efficiently, we can finish before the deadline.', 'Nếu làm việc hiệu quả hơn, chúng ta có thể xong trước hạn.']],
  },
  {
    id: 'responsible', topic: 'Văn phòng', ipa: '/rɪˈspɒnsəbl/',
    words: [['responsible', 'adj', 'chịu trách nhiệm'], ['responsibility', 'n', 'trách nhiệm'], ['responsibly', 'adv', 'có trách nhiệm'], ['irresponsible', 'adj', 'vô trách nhiệm']],
    syn: ['accountable', 'in charge'], ant: ['irresponsible'],
    ex: [['Mr. Diaz is responsible for training employees who have just joined.', 'Ông Diaz chịu trách nhiệm đào tạo các nhân viên mới vào.'],
      ['One of the responsibilities that this role includes is managing the budget.', 'Một trong những trách nhiệm của vai trò này là quản lý ngân sách.']],
  },
  {
    id: 'rely', topic: 'Văn phòng', ipa: '/rɪˈlaɪ/',
    words: [['rely', 'v', 'dựa vào, tin cậy'], ['reliable', 'adj', 'đáng tin cậy'], ['reliability', 'n', 'độ tin cậy'], ['reliance', 'n', 'sự phụ thuộc'], ['unreliable', 'adj', 'không đáng tin']],
    syn: ['depend', 'trustworthy', 'dependable'], ant: ['unreliable', 'undependable'],
    ex: [['We need a supplier that we can rely on during the busy season.', 'Chúng ta cần một nhà cung cấp mà ta có thể tin cậy trong mùa cao điểm.'],
      ['The reliability of the data depends on how it was collected.', 'Độ tin cậy của dữ liệu phụ thuộc vào cách nó được thu thập.']],
  },
  {
    id: 'expand', topic: 'Kinh doanh', ipa: '/ɪkˈspænd/',
    words: [['expand', 'v', 'mở rộng'], ['expansion', 'n', 'sự mở rộng'], ['expansive', 'adj', 'rộng lớn']],
    syn: ['enlarge', 'grow', 'extend'], ant: ['reduce', 'shrink', 'contract'],
    ex: [['The company plans to expand into Asia, where demand is growing quickly.', 'Công ty dự định mở rộng sang châu Á, nơi nhu cầu đang tăng nhanh.'],
      ['The expansion of the factory will create 200 jobs.', 'Việc mở rộng nhà máy sẽ tạo ra 200 việc làm.']],
  },
  {
    id: 'announce', topic: 'Hội họp', ipa: '/əˈnaʊns/',
    words: [['announce', 'v', 'thông báo, công bố'], ['announcement', 'n', 'thông báo']],
    syn: ['declare', 'notify', 'reveal'], ant: ['conceal', 'withhold'],
    ex: [['The CEO announced that the company would open two new stores.', 'Giám đốc điều hành thông báo rằng công ty sẽ mở hai cửa hàng mới.'],
      ['Please listen carefully to the announcement that follows.', 'Vui lòng nghe kỹ thông báo sau đây.']],
  },
  {
    id: 'recommend', topic: 'Văn phòng', ipa: '/ˌrekəˈmend/',
    words: [['recommend', 'v', 'giới thiệu, đề xuất'], ['recommendation', 'n', 'lời đề xuất; thư giới thiệu']],
    syn: ['suggest', 'advise', 'propose'], ant: ['discourage', 'oppose'],
    ex: [['I recommend that you book early because rooms sell out quickly.', 'Tôi khuyên bạn nên đặt sớm vì phòng hết rất nhanh.'],
      ['She asked her former manager to write a letter of recommendation.', 'Cô ấy nhờ quản lý cũ viết một thư giới thiệu.']],
  },
  {
    id: 'analyze', topic: 'Văn phòng', ipa: '/ˈænəlaɪz/',
    words: [['analyze', 'v', 'phân tích'], ['analysis', 'n', 'sự phân tích'], ['analyst', 'n', 'nhà phân tích'], ['analytical', 'adj', 'mang tính phân tích']],
    syn: ['examine', 'evaluate', 'study'], ant: ['ignore', 'overlook'],
    ex: [['The analyst who studied the survey results will present her findings.', 'Nhà phân tích nghiên cứu kết quả khảo sát sẽ trình bày phát hiện của cô ấy.'],
      ['Strong analytical skills are required for this position.', 'Vị trí này yêu cầu kỹ năng phân tích tốt.']],
  },
  {
    id: 'increase', topic: 'Kinh doanh', ipa: '/ɪnˈkriːs/',
    words: [['increase', 'v/n', 'tăng; sự gia tăng'], ['increasing', 'adj', 'ngày càng tăng'], ['increasingly', 'adv', 'ngày càng']],
    syn: ['rise', 'grow', 'boost'], ant: ['decrease', 'decline', 'reduce'],
    ex: [['Online shopping has become increasingly popular, which worries small stores.', 'Mua sắm trực tuyến ngày càng phổ biến, điều này khiến các cửa hàng nhỏ lo lắng.'],
      ['There was a sharp increase in sales after the price was lowered.', 'Doanh số tăng mạnh sau khi giá được giảm.']],
  },
]

// Word -> info, used for instant lookup when text is highlighted
export const DICT = new Map()
for (const f of FAMILIES) {
  for (const [w, pos, vi] of f.words) DICT.set(w.toLowerCase(), { w, pos, vi, family: f.id })
}

// Each word form becomes one flashcard
export const CARDS = FAMILIES.flatMap((f) =>
  f.words.map(([w, pos, vi], i) => ({
    id: `${f.id}:${w}`, family: f.id, topic: f.topic, w, pos, vi,
    ex: f.ex[i % f.ex.length], syn: f.syn, ant: f.ant,
  })),
)

export const TOPICS = [...new Set(FAMILIES.map((f) => f.topic))]

// ---- TOEIC Service List (Kaggle jimregan/toeic-service-list, CC BY-SA 4.0) ----
// 1,259 words ordered by how often they appear in TOEIC materials; Vietnamese meanings added by Capy TOEIC.
// Example sentences from Tatoeba (CC BY 2.0 FR) where one was found.
import TSL from './tsl.json' with { type: 'json' }
import EXAMPLES from './examples.json' with { type: 'json' }

export const TSL_SOURCE = TSL.source
const DECK_SIZE = 100
export const TSL_CARDS = TSL.words
  .map(([w, pos, vi, def], rank) => ({ w, pos, vi, def, rank }))
  .filter((c) => !DICT.has(c.w.toLowerCase())) // already taught in a word family
  .map((c) => {
    const ex = EXAMPLES.examples[c.w]
    const from = Math.floor(c.rank / DECK_SIZE) * DECK_SIZE
    return { id: `tsl:${c.w}`, topic: `TOEIC ${from + 1}–${from + DECK_SIZE}`, w: c.w, pos: c.pos, vi: c.vi, def: c.def, rank: c.rank + 1, ex: ex ? [ex[0], ex[1]] : null, tsl: true }
  })
for (const c of TSL_CARDS) DICT.set(c.w.toLowerCase(), { w: c.w, pos: c.pos, vi: c.vi })
export const TSL_DECKS = [...new Set(TSL_CARDS.map((c) => c.topic))]

// Order for new words: TOEIC list by frequency, with the word families mixed in
export const ALL_CARDS = (() => {
  const out = []
  const every = Math.max(1, Math.round(TSL_CARDS.length / CARDS.length))
  let f = 0
  TSL_CARDS.forEach((c, i) => {
    out.push(c)
    if (i % every === every - 1 && f < CARDS.length) out.push(CARDS[f++])
  })
  while (f < CARDS.length) out.push(CARDS[f++])
  return out
})()
export const CARD_BY_ID = new Map(ALL_CARDS.map((c) => [c.id, c]))
