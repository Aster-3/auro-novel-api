export const getMailTemplate = (code: string) => {
  const navy = "#0f1c3f";
  const navySoft = "#1e2f63";
  const textGray = "#6f7685";
  const borderSoft = "#e6e8ef";

  return `
  <div style="
    background:#f6f8fc;
    padding:60px 20px;
    font-family:'Inter',-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;
    -webkit-font-smoothing:antialiased;
  ">

    <div style="
      max-width:520px;
      margin:0 auto;
      background:#ffffff;
      border:1px solid ${borderSoft};
      padding:48px 42px;
    ">

      <!-- HEADER -->

      <div style="
        margin-bottom:40px;
        padding-bottom:18px;
        border-bottom:1px solid ${borderSoft};
      ">
        <span style="
          font-size:13px;
          font-weight:700;
          letter-spacing:3px;
          color:${navy};
          text-transform:uppercase;
        ">
          AURO NOVEL / VERIFICATION
        </span>
      </div>

      <!-- TITLE -->

      <h1 style="
        font-size:23px;
        font-weight:500;
        line-height:1.35;
        margin-bottom:18px;
        letter-spacing:-0.2px;
        color:${navy};
      ">
        Hesabınızı doğrulamak için<br/>
        aşağıdaki kodu kullanın.
      </h1>

      <!-- DESCRIPTION -->

      <p style="
        font-size:14px;
        color:${textGray};
        line-height:1.6;
        margin-bottom:36px;
      ">
        Güvenliğiniz için bu kod yalnızca 15 dakika boyunca geçerlidir.
      </p>

      <!-- CODE BOX -->

      <div style="
        margin-bottom:46px;
      ">
        <div style="
          display:flex;
          align-items:center;
          justify-content:center;
          background:${navy};
          color:#ffffff;
          padding:18px 20px;
          border-radius:4px;
          font-size:34px;
          font-weight:600;
          letter-spacing:8px;
          white-space:nowrap;
        ">
          ${code}
        </div>
      </div>

      <!-- FOOTER -->

      <div style="
        margin-top:50px;
        border-top:1px solid ${borderSoft};
        padding-top:24px;
      ">

        <p style="
          font-size:11px;
          color:#9aa0ad;
          line-height:1.7;
          margin:0 0 18px 0;
        ">
          Bu e-posta sistem tarafından otomatik olarak gönderilmiştir.<br/>
          Eğer bu işlemi siz yapmadıysanız bu mesajı görmezden gelebilirsiniz.
        </p>

        <div style="
          font-size:11px;
          font-weight:700;
          letter-spacing:1px;
          color:${navySoft};
        ">
          EST. 2026 — AURO NOVEL LABS
        </div>

      </div>

    </div>
  </div>
  `;
};
