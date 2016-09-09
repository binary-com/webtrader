import subprocess, os, fnmatch, re
from HTMLParser import HTMLParser

# This array will be added to generator .po files regardless of contents in html or js files.
# These keys are mostly fileds returned from websocket that are not translated.(Or are not string literals in .js files).
static = [
    'Digits', 'ticks', 'Ms', 'Wed', 'Sun', 'Fri', 'Investments & Dividends', 'Up/Down', 'Primary',
    'second', 'Other', 'Health', 'Mrs', 'Lower', 'Higher', 'Download PNG', 'Name of your pet',
    'Double click the object to remove', 'Finance', 'Self-Employed', 'Rise', 'Memorable date',
    'In order to properly apply theme, a full refresh of page is required. Are you sure you want to proceed?',
    '40 transactions or more in the past 12 months', 'Rise', 'Memorable date', 'Construction', 'Mon', 'Fall',
    'Now', 'Tourism', 'Tue', 'Secondary', 'Payout', '6-10 transactions in the past 12 months',
    'Do you want to install Webtrader chrome extension?', 'Spreads', 'Duration', 'Favourite artist',
    'seconds', 'Thu', 'Favourite dish', 'Less than', 'hours', 'Remove Selected', 'Pension', 'Download SVG',
    'Mr', 'Download CSV', "Mother's maiden name", 'tick', 'Brand of first car', 'day', 'minute', 'Asians',
    'Name of first love', '1-2 years', 'Over 3 years', 'hour', 'Touch/No Touch', 'Memorable town/city',
    'Over', 'Total Profit/Loss', 'Stake', 'days', '0-1 year', 'Salaried Employee', '0-5 transactions in the past 12 months',
    'Cancel', 'In/Out', 'Education', 'Miss', 'Tertiary', 'Sat', 'Loading...', 'January', 'February', 'March', 'April', 
    'June', 'July', 'August', 'September', 'October', 'November', 'December', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 
    'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 
    'Reset zoom', 'Reset zoom level 1:1', 'Zoom', 'From', 'To', 'Print chart', 'Download PNG image', 
    'Download JPEG image', 'Download PDF document', 'Download SVG vector image', 'Chart context menu',
    '1 Tick', '1 Minute', '2 Minutes', '3 Minutes', '5 Minutes', '10 Minutes', '15 Minutes', '30 Minutes', '1 Hour', '2 Hours', 
    '4 Hours', '8 Hours', '1 Day', 'Candles', 'OHLC', 'Line', 'Dot', 'Line Dot', 'Spline', 'Table', '1t', '1m', '2m', '3m', 
    '5m', '10m', '15m', '30m', '1h', '2h', '4h', '8h', '1d', '1', '2', '3', '4', '5', '8', '10', '15', '30'
]

# Parsing webtrader html files.
class WebtraderParser(HTMLParser):
    def __init__(self):
        HTMLParser.__init__(self)
        self.is_script = False
        self.texts = list(static) # clone
    def handle_starttag(self, tag, attrs):
        if tag == 'script' or tag=='style':
            self.is_script = True
        for attr in attrs:
            if attr[0] == "data-balloon":
                self.texts.append(attr[1]);
    def handle_endtag(self, tag):
        if tag == 'script' or tag=='style':
            self.is_script = False
    def handle_data(self, text):
        if not self.is_script: # ignore script and style tags
            text = re.sub( '\s+', ' ', text).strip(' \t\r\n*,+.:')
            if text != '' and len(text) > 1: # ignore empty and single character strings.
                if (text[0] == '{' and text[-1] == '}') : return #ignore rivetsjs tags
                self.texts.append(text)
    def parse_html_files(self, path):
        file_pattern = "*.html"
        for path, dirs, files in os.walk(path):
            for file_name in fnmatch.filter(files, file_pattern):
                file_path = os.path.join(path, file_name)
                with open(file_path) as f:
                    html = f.read()
                    self.feed(html);
            for dir in dirs:
                self.parse_html_files(os.path.join(path, dir))
    def parse_js_files(self, path):
        lines = subprocess.Popen( ['node', 'extract.js'], stdout=subprocess.PIPE ).communicate()[0]
        for line in lines.split('\n'):
            for text in re.split(r'<.+?>', line):
                text = re.sub( '\s+', ' ', text).strip(' \t\r\n*,+.:-_"\'()').strip();
                if text != '' and len(text) > 1: # ignore empty and single character strings.
                    self.texts.append(text)

    def get_texts(self):
        return sorted(set(self.texts)) # sort and remove duplicates

parser = WebtraderParser()
print "parsing ../src/**/*.html files ..."
parser.parse_html_files('../src')
print "parsing ../src/**/*.js files ..."
parser.parse_js_files('../src')
texts = parser.get_texts()

messages_pot = './i18n/messages.pot'

os.remove(messages_pot);
with open(messages_pot, 'a+') as wf:
    for text in texts:
        text = text.replace('"', '\\"')
        text = re.sub(r'[^\x00-\x7F]+',' ', text).strip() # remove non aski characters
        if text:
            wf.write('\n' + 'msgid "' + text + '"'      )
            wf.write('\nmsgstr "" \n')

files = [
    './i18n/ar.po',
    './i18n/de.po',
    './i18n/en.po',
    './i18n/es.po',
    './i18n/fr.po',
    './i18n/id.po',
    './i18n/it.po',
    './i18n/ja.po',
    './i18n/pl.po',
    './i18n/pt.po',
    './i18n/ru.po',
    './i18n/vi.po',
    './i18n/zh_cn.po',
    './i18n/zh_tw.po',
]

# on OSX install the 'msgmerge' command via homebrow
# brew install gettext
# brew link gettext --force
for f in files:
    subprocess.call(['msgmerge', '--output-file=' + f, f, './i18n/messages.pot'])

# to extract translated string from a to b
# msgmerge -N -o i18n/zh_tw.po temp/zh_tw.po ref/zh_tw.po
