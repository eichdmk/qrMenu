import { useScrollToTop } from "../hooks/useScrollToTop";

const HIGHLIGHT_STYLE = {
  fontWeight: 600,
  color: "#0f766e",
};

function Requisites() {
  useScrollToTop();

  return (
    <div className="legal-page">
      <h1>Реквизиты и контакты</h1>
      <p>
        На этой странице представлены сведения о владельце сервиса Key Bar. Проверьте и
        при необходимости обновите данные перед публикацией страницы, чтобы они совпадали
        с официальными документами и данными, указанными в договоре с YooKassa.
      </p>

      <section>
        <h2>1. Общая информация</h2>
        <ul>
          <li>
            <span style={HIGHLIGHT_STYLE}>Юридическое название:&nbsp;</span>
            ИП __________________________ (замените на фактическое)
          </li>
          <li>
            <span style={HIGHLIGHT_STYLE}>Торговая марка:&nbsp;</span>
            Key Bar
          </li>
          <li>
            <span style={HIGHLIGHT_STYLE}>ИНН:&nbsp;</span>
            ____________
          </li>
          <li>
            <span style={HIGHLIGHT_STYLE}>ОГРНИП / ОГРН:&nbsp;</span>
            ____________
          </li>
          <li>
            <span style={HIGHLIGHT_STYLE}>Банковские реквизиты:&nbsp;</span>
            Расчётный счёт ____________, БИК ____________, банк ____________
          </li>
          <li>
            <span style={HIGHLIGHT_STYLE}>Юридический адрес:&nbsp;</span>
            364049, РФ, Чеченская Республика, г. Грозный, ул. Дьякова, 21 (уточните при необходимости)
          </li>
          <li>
            <span style={HIGHLIGHT_STYLE}>Фактический адрес:&nbsp;</span>
            364049, РФ, Чеченская Республика, г. Грозный, ул. Дьякова, 21
          </li>
        </ul>
      </section>

      <section>
        <h2>2. Контакты для связи</h2>
        <p>По вопросам заказов, оплаты и сотрудничества:</p>
        <ul>
          <li>
            <span style={HIGHLIGHT_STYLE}>Телефон:&nbsp;</span>
            +7&nbsp;999&nbsp;400&nbsp;60&nbsp;00
          </li>
          {/* <li>
            <span style={HIGHLIGHT_STYLE}>Электронная почта:&nbsp;</span>
            info@key-bar.ru (укажите актуальный email)
          </li> */}
          <li>
            <span style={HIGHLIGHT_STYLE}>Мессенджеры:&nbsp;</span>
            WhatsApp : +7&nbsp;999&nbsp;400&nbsp;60&nbsp;00
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Документы</h2>
        <p>
          При необходимости приложите ссылки на учредительные документы, публичную оферту,
          правила оказания услуг. Это поле необязательно, но упрощает проверку со стороны YooKassa.
        </p>
        <ul>
          <li>
            <a href="/privacy">Политика конфиденциальности</a>
          </li>
          <li>
            <a href="/terms">Условия использования</a>
          </li>
        </ul>
      </section>

      <section>
        <h2>4. Примечания</h2>
        <p>
          После заполнения всех полей замените подчёркнутые плейсхолдеры на действительные
          данные. YooKassa проверяет эту страницу при подключении и в дальнейшем может
          сверять сведения на сайте с договором и платёжными документами.
        </p>
      </section>
    </div>
  );
}

export default Requisites;
